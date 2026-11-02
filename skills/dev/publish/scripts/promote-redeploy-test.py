#!/usr/bin/env python3
"""Exercise the real release CLI with isolated home and provider executables."""
import json
import os
from pathlib import Path
import subprocess
import tempfile
import unittest

SCRIPT = Path(__file__).with_name('promote.sh').resolve()
SHA = 'a' * 40
API = 'srv-dar05h3ncjis73bki8qg'
WORKER = 'srv-dar05h3ncjis73bki8s0'


class RedeployTest(unittest.TestCase):
    def test_pinned_configuration_redeploy(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / '.render').mkdir()
            (root / '.render/cli.yaml').write_text('key: fixture\n')
            lock = root / '.thoven/releases/lock'
            lock.mkdir(parents=True)
            release = root / 'release.json'
            release.write_text(json.dumps(dict(id='fixture', be=dict(to=SHA, **{'from': SHA}),
                fe=dict(to=SHA, **{'from': SHA}), rollback=False, migrations=[],
                staging_hold='b' * 32, done={})))
            (lock / 'release').write_text(str(release))
            binaries = root / 'bin'
            binaries.mkdir()
            fakes = {
                'hostname': '#!/bin/sh\necho fixture-laptop\n',
                'ssh': '#!/bin/sh\ncase "$*" in *release-hold*) echo released;; *) printf aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa;; esac\n',
                'curl': '''#!/usr/bin/env python3
import json, os, pathlib, sys
args = sys.argv[1:]
url = next(x for x in args if x.startswith('https://'))
method = args[args.index('-X')+1] if '-X' in args else 'GET'
with open(os.environ['CALLS'], 'a') as f:
 f.write(json.dumps(dict(url=url, method=method, data=args[args.index('-d')+1] if '-d' in args else None))+'\\n')
sha = 'a'*40
if method == 'POST':
 output = dict(id='new-'+url.split('/')[-2])
elif '/deploys?' in url:
 output = [dict(deploy=dict(id='previous', status='live', commit=dict(id=sha)))]
elif '/deploys/new-' in url:
 output = dict(status='live')
elif url.endswith('/up'):
 print('200', end=''); sys.exit(0)
elif url.endswith('/health'):
 output = dict(revision=dict(sha=sha))
elif url.endswith('/webhooks'):
 output = [dict(url='https://api.thoven.co/webhooks/daily', uuid='fixture', state='ACTIVE')]
else:
 sys.exit('unexpected provider request: '+url)
if '-o' in args:
 pathlib.Path(args[args.index('-o')+1]).write_text(json.dumps(output)); print('201', end='')
else:
 print(json.dumps(output))
'''}
            for name, source in fakes.items():
                file = binaries / name
                file.write_text(source)
                file.chmod(0o755)
            calls = root / 'calls'
            environment = dict(os.environ, HOME=str(root), PATH=str(binaries)+os.pathsep+os.environ['PATH'],
                               CALLS=str(calls), DAILY_API_KEY='fixture')
            def run(*arguments):
                calls.write_text('')
                result = subprocess.run(['bash', str(SCRIPT), *arguments], env=environment,
                                        text=True, capture_output=True, timeout=30)
                events = [json.loads(line) for line in calls.read_text().splitlines()]
                return result, events
            result, events = run('backend', 'fixture')
            self.assertEqual(result.returncode, 0, result.stderr)
            self.assertEqual([e for e in events if e['method']=='POST'], [])
            result, events = run('backend', 'fixture', '--redeploy')
            self.assertEqual(result.returncode, 0, result.stderr)
            posts = [e for e in events if e['method']=='POST']
            self.assertEqual([e['url'].split('/')[-2] for e in posts], [API, WORKER])
            for event in posts:
                self.assertEqual(json.loads(event['data'])['commitId'], SHA)
            health = next(i for i, e in enumerate(events) if e['url'].endswith('/health'))
            self.assertLess(health, events.index(posts[1]))
            for arguments in [('backend', 'fixture', '--unknown'), ('frontend', 'fixture', '--redeploy'),
                              ('backend', 'fixture', '--redeploy', '--extra'), ('backend',)]:
                result, events = run(*arguments)
                self.assertNotEqual(result.returncode, 0)
                self.assertEqual(events, [])


if __name__ == '__main__':
    unittest.main()
