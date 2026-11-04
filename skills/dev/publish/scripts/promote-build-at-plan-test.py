#!/usr/bin/env python3
"""Plan starts the production build it needs, and the frontend step waits for that build."""
import json
import os
from pathlib import Path
import subprocess
import tempfile
import unittest

SCRIPT = Path(__file__).with_name('promote.sh').resolve()
PROJECT = 'prj_kJp3i6YAA6bC5jOGbg7xypzIkPta'

FAKE_VERCEL = r'''#!/usr/bin/env python3
import json, os, sys
args = sys.argv[1:]
assert args[0] == 'api', args
path = args[1]
method = args[args.index('-X')+1] if '-X' in args else 'GET'
body = sys.stdin.read() if '--input' in args else None
state_file = os.environ['STATE']
state = json.load(open(state_file))
with open(os.environ['CALLS'], 'a') as f:
    f.write(json.dumps(dict(tool='vercel', path=path, method=method, body=body))+'\n')
if path.startswith('/v13/deployments?') and method == 'POST':
    if state.get('refuse_create'):
        sys.exit('Vercel refused')
    out = dict(id='dpl_new')
elif path.startswith('/v13/deployments/'):
    dep = path.split('/')[-1]
    status = state['builds'][dep]
    if status == 'READY':
        state['deployments'].append(dict(uid=dep, url=dep+'.vercel.app', projectId=os.environ['PROJECT'],
                                         target='production', createdAt=state.get('created', {}).get(dep, 2000),
                                         meta=dict(githubCommitSha=state['fe_to'])))
    out = dict(readyState=status, url=dep+'.vercel.app')
elif '/promote/' in path:
    state['site'] = state['fe_to']
    out = {}
elif path.startswith('/v6/deployments'):
    out = dict(deployments=state['deployments'])
elif path.endswith('/env'):
    out = dict(envs=[dict(target=['production'], updatedAt=1000)])
elif path.startswith('/v9/projects/'):
    out = dict(autoAssignCustomDomains=False, link=dict(repoId=123),
               targets=dict(production=dict(meta=dict(githubCommitSha=state['site']))))
else:
    sys.exit('unexpected vercel request: '+path)
json.dump(state, open(state_file, 'w'))
print(json.dumps(out))
'''

FAKE_CURL = r'''#!/usr/bin/env python3
import json, os, sys
url = next(x for x in sys.argv[1:] if x.startswith('https://'))
state = json.load(open(os.environ['STATE']))
if '/deploys?' in url:
    print(json.dumps([dict(deploy=dict(status='live', commit=dict(id=state['be'])))]))
elif url == 'https://thoven.co/api/version':
    print(json.dumps(dict(sha=state['site'])))
else:
    sys.exit('unexpected curl request: '+url)
'''

FAKES = {
    'vercel': FAKE_VERCEL,
    'curl': FAKE_CURL,
    'hostname': '#!/bin/sh\necho fixture-laptop\n',
    'ssh': '#!/bin/sh\ncase "$*" in *release-hold*) echo released;; *) printf aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa;; esac\n',
    'neonctl': '#!/bin/sh\necho "[]"\n',
}


def git(*arguments, cwd):
    return subprocess.run(['git', *arguments], cwd=cwd, check=True, text=True,
                          capture_output=True).stdout.strip()


def repository(root, name, commits):
    origin = root / f'{name}.git'
    git('init', '-q', '--bare', '-b', 'main', str(origin), cwd=root)
    work = root / 'thoven' / name
    work.parent.mkdir(exist_ok=True)
    git('clone', '-q', str(origin), str(work), cwd=root)
    shas = []
    for index in range(commits):
        (work / 'file').write_text(str(index))
        git('add', 'file', cwd=work)
        git('-c', 'user.name=fixture', '-c', 'user.email=fixture@example.com',
            'commit', '-q', '-m', f'commit {index}', cwd=work)
        shas.append(git('rev-parse', 'HEAD', cwd=work))
    git('push', '-q', 'origin', 'main', cwd=work)
    return shas


class BuildAtPlanTest(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.root = Path(self.directory.name)
        (self.root / '.render').mkdir()
        (self.root / '.render/cli.yaml').write_text('key: fixture\n')
        [self.be] = repository(self.root, 'backend', 1)
        self.fe_from, self.fe_to = repository(self.root, 'frontend', 2)
        binaries = self.root / 'bin'
        binaries.mkdir()
        for name, source in FAKES.items():
            (binaries / name).write_text(source)
            (binaries / name).chmod(0o755)
        self.state = self.root / 'state.json'
        self.calls = self.root / 'calls'
        self.environment = dict(os.environ, HOME=str(self.root), STATE=str(self.state),
                                CALLS=str(self.calls), PROJECT=PROJECT,
                                PATH=str(binaries)+os.pathsep+os.environ['PATH'])
        self.write_state(deployments=[], builds={'dpl_new': 'READY'})

    def tearDown(self):
        self.directory.cleanup()

    def write_state(self, **fields):
        state = dict(be=self.be, site=self.fe_from, fe_to=self.fe_to, deployments=[], builds={})
        state.update(fields)
        self.state.write_text(json.dumps(state))

    def run_step(self, *arguments):
        self.calls.write_text('')
        result = subprocess.run(['bash', str(SCRIPT), *arguments], env=self.environment,
                                text=True, capture_output=True, timeout=60)
        events = [json.loads(line) for line in self.calls.read_text().splitlines()]
        return result, events

    def creates(self, events):
        return [e for e in events if e['path'].startswith('/v13/deployments?') and e['method'] == 'POST']

    def promotes(self, events):
        return [e['path'].split('/')[-1] for e in events if '/promote/' in e['path']]

    def release(self):
        pointer = self.root / '.thoven/releases/lock/release'
        return json.loads(Path(pointer.read_text().strip()).read_text())

    def open_release(self, build_started):
        lock = self.root / '.thoven/releases/lock'
        lock.mkdir(parents=True)
        release = self.root / '.thoven/releases/fixture.json'
        release.write_text(json.dumps(dict(
            id='fixture', rollback=False, staging_hold='a' * 32,
            be={'from': self.be, 'to': self.be}, fe={'from': self.fe_from, 'to': self.fe_to},
            migrations=[], build_at_plan='', build_started=build_started,
            done=dict(snapshot=False, backend=False, api_healthy=False, frontend=False))))
        (lock / 'release').write_text(str(release))

    def test_plan_starts_a_forced_production_build_when_none_is_ready(self):
        result, events = self.run_step('plan', '--be', 'keep', '--fe', self.fe_to)
        self.assertEqual(result.returncode, 0, result.stderr)
        [create] = self.creates(events)
        self.assertIn('forceNew=1', create['path'])
        body = json.loads(create['body'])
        self.assertEqual(body['target'], 'production')
        self.assertIs(body['autoAssignCustomDomains'], False)
        self.assertEqual(body['gitSource']['sha'], self.fe_to)
        self.assertEqual(self.release()['build_started'], 'dpl_new')
        self.assertIn('started dpl_new', result.stdout)

    def test_plan_starts_nothing_when_a_fresh_build_is_ready(self):
        ready = dict(uid='dpl_ready', url='ready.vercel.app', projectId=PROJECT, target='production',
                     createdAt=2000, meta=dict(githubCommitSha=self.fe_to))
        self.write_state(deployments=[ready])
        result, events = self.run_step('plan', '--be', 'keep', '--fe', self.fe_to)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(self.creates(events), [])
        self.assertIsNone(self.release()['build_started'])

    def test_frontend_promotes_the_build_plan_started(self):
        self.write_state(builds={'dpl_plan': 'READY'})
        self.open_release('dpl_plan')
        result, events = self.run_step('frontend', 'fixture')
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(self.creates(events), [])
        self.assertEqual(self.promotes(events), ['dpl_plan'])
        self.assertIn(f'thoven.co serves {self.fe_to[:9]}', result.stdout)

    def test_frontend_stops_when_the_build_plan_started_failed(self):
        self.write_state(builds={'dpl_plan': 'ERROR'})
        self.open_release('dpl_plan')
        result, events = self.run_step('frontend', 'fixture')
        self.assertNotEqual(result.returncode, 0)
        self.assertIn('build dpl_plan failed', result.stderr)
        self.assertEqual(self.creates(events), [])
        self.assertEqual(self.promotes(events), [])
        self.assertIsNone(self.release()['build_started'])

    def test_frontend_builds_afresh_when_the_plan_build_predates_an_env_change(self):
        self.write_state(builds={'dpl_plan': 'READY', 'dpl_new': 'READY'}, created={'dpl_plan': 500})
        self.open_release('dpl_plan')
        result, events = self.run_step('frontend', 'fixture')
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(len(self.creates(events)), 1)
        self.assertEqual(self.promotes(events), ['dpl_new'])

    def test_plan_still_plans_when_vercel_refuses_the_build(self):
        self.write_state(refuse_create=True)
        result, events = self.run_step('plan', '--be', 'keep', '--fe', self.fe_to)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertNotIn('FAILED at line', result.stderr)
        self.assertIsNone(self.release()['build_started'])
        self.assertIn('the frontend step builds one', result.stdout)


if __name__ == '__main__':
    unittest.main()
