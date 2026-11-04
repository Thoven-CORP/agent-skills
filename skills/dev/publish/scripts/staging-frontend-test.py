#!/usr/bin/env python3
"""staging-frontend.sh builds a commit of main from GitHub onto staging and waits until staging serves it."""
import json
import os
from pathlib import Path
import subprocess
import tempfile
import unittest

SCRIPT = Path(__file__).with_name('staging-frontend.sh').resolve()
STAGING = 'prj_ntC0WSpEsmwiVQ0hfgW6sA327FfT'

FAKE_VERCEL = r'''#!/usr/bin/env python3
import json, os, sys
args = sys.argv[1:]
path = args[1]
method = args[args.index('-X')+1] if '-X' in args else 'GET'
body = sys.stdin.read() if '--input' in args else None
state = json.load(open(os.environ['STATE']))
with open(os.environ['CALLS'], 'a') as f:
    f.write(json.dumps(dict(path=path, method=method, body=body))+'\n')
if path.startswith('/v13/deployments?') and method == 'POST':
    state['building'] = json.loads(body)['gitSource']['sha']
    out = dict(id='dpl_stg')
elif path.startswith('/v13/deployments/'):
    out = dict(readyState=state['result'], url='stg.vercel.app')
    if state['result'] == 'READY':
        state['site'] = state['building']
elif path.startswith('/v9/projects/'):
    out = dict(link=dict(repoId=123))
else:
    sys.exit('unexpected vercel request: '+path)
json.dump(state, open(os.environ['STATE'], 'w'))
print(json.dumps(out))
'''

FAKE_CURL = r'''#!/usr/bin/env python3
import json, os, sys
url = next(x for x in sys.argv[1:] if x.startswith('https://'))
assert url == 'https://staging.thoven.co/api/version', url
print(json.dumps(dict(sha=json.load(open(os.environ['STATE']))['site'])))
'''


def git(*arguments, cwd):
    return subprocess.run(['git', '-c', 'user.name=fixture', '-c', 'user.email=fixture@example.com',
                           *arguments], cwd=cwd, check=True, text=True, capture_output=True).stdout.strip()


class StagingFrontendTest(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        root = Path(self.directory.name)
        git('init', '-q', '--bare', '-b', 'main', str(root / 'frontend.git'), cwd=root)
        work = root / 'thoven/frontend'
        work.parent.mkdir()
        git('clone', '-q', str(root / 'frontend.git'), str(work), cwd=root)
        shas = []
        for index in range(2):
            (work / 'file').write_text(str(index))
            git('add', 'file', cwd=work)
            git('commit', '-q', '-m', f'commit {index}', cwd=work)
            shas.append(git('rev-parse', 'HEAD', cwd=work))
        git('push', '-q', 'origin', 'main', cwd=work)
        self.old, self.tip = shas
        git('checkout', '-q', '-b', 'side', cwd=work)
        (work / 'file').write_text('side')
        git('commit', '-q', '-am', 'side', cwd=work)
        self.side = git('rev-parse', 'HEAD', cwd=work)
        binaries = root / 'bin'
        binaries.mkdir()
        for name, source in dict(vercel=FAKE_VERCEL, curl=FAKE_CURL).items():
            (binaries / name).write_text(source)
            (binaries / name).chmod(0o755)
        self.state = root / 'state.json'
        self.calls = root / 'calls'
        self.environment = dict(os.environ, HOME=str(root), STATE=str(self.state), CALLS=str(self.calls),
                                PATH=str(binaries)+os.pathsep+os.environ['PATH'])

    def tearDown(self):
        self.directory.cleanup()

    def run_script(self, *arguments, site, result='READY'):
        self.state.write_text(json.dumps(dict(site=site, result=result)))
        self.calls.write_text('')
        run = subprocess.run(['bash', str(SCRIPT), *arguments], env=self.environment,
                             text=True, capture_output=True, timeout=60)
        events = [json.loads(line) for line in self.calls.read_text().splitlines()]
        creates = [e for e in events if e['method'] == 'POST']
        return run, creates

    def test_builds_the_tip_of_main_from_github_and_waits_until_staging_serves_it(self):
        run, creates = self.run_script(site=self.old)
        self.assertEqual(run.returncode, 0, run.stderr)
        [create] = creates
        self.assertIn('forceNew=1', create['path'])
        body = json.loads(create['body'])
        self.assertEqual((body['project'], body['name'], body['target']), (STAGING, 'thoven-staging', 'production'))
        self.assertIs(body['autoAssignCustomDomains'], True)
        self.assertEqual(body['gitSource'], dict(type='github', repoId=123, ref='main', sha=self.tip))
        self.assertIn(f'staging serves {self.tip[:9]}', run.stdout)

    def test_does_nothing_when_staging_already_serves_the_commit(self):
        run, creates = self.run_script(site=self.tip)
        self.assertEqual(run.returncode, 0, run.stderr)
        self.assertEqual(creates, [])
        self.assertIn('staging already serves', run.stdout)

    def test_deploys_a_named_older_commit_of_main(self):
        run, creates = self.run_script(self.old[:9], site=self.tip)
        self.assertEqual(run.returncode, 0, run.stderr)
        self.assertEqual(json.loads(creates[0]['body'])['gitSource']['sha'], self.old)

    def test_refuses_a_commit_off_main(self):
        run, creates = self.run_script(self.side, site=self.old)
        self.assertNotEqual(run.returncode, 0)
        self.assertIn("not a merge point on main's line", run.stderr)
        self.assertEqual(creates, [])

    def test_stops_when_the_build_fails(self):
        run, creates = self.run_script(site=self.old, result='ERROR')
        self.assertNotEqual(run.returncode, 0)
        self.assertIn('build dpl_stg failed', run.stderr)
        self.assertNotIn('staging serves', run.stdout)


if __name__ == '__main__':
    unittest.main()
