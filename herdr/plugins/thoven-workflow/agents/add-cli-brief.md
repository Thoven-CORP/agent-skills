Wire the `{cli}` CLI into ~/thoven/agent-skills/config/agents.toml so Ctrl+Space t can dispatch it (THV-1078). herdr already runs it (`herdr agent start --kind {cli}`); what is missing is how it takes a model, an effort and a permission bypass.

1. Read `{cli} --help` and the help of its subcommands. Find, for an INTERACTIVE session:
   - how to set the model: a flag, or only a settings file (see [cli.droid], which writes one through `settings` and `{settings_file}`);
   - how to set the reasoning effort, and its effort words, lowest first;
   - the flag that skips permission prompts;
   - a command that lists models, and its output format.
2. Write a `[cli.{cli}]` block to /tmp/{cli}-block.toml. Follow the field comments at the top of agents.toml and the existing blocks. Required: kind = "{cli}", label, skill_prefix, launch. Add models_from when a live list exists; otherwise list the models you found under models.
3. Prove it before publishing:
   - cp ~/thoven/agent-skills/config/agents.toml /tmp/agents-probe.toml
   - THOVEN_AGENTS_CONFIG=/tmp/agents-probe.toml python3 {agents} add-cli {cli} /tmp/{cli}-block.toml
   - with that same THOVEN_AGENTS_CONFIG, run `python3 {agents} models {cli}` and `python3 {agents} launch {cli} <model> [effort] | tr '\0' ' '`
   - open a scratch tab (`{herdr} tab create --label "probe {cli}" --no-focus`), start the CLI there with `{herdr} agent start probe-{cli} --kind {cli} --pane <pane> -- <those arguments>`, and read its screen with `{herdr} agent read probe-{cli}`. Confirm that the model and the permission mode you set show on its first screen or footer. Close the scratch tab.
4. Publish it: `bash {publish} "Wire {cli} into agents.toml" add-cli {cli} /tmp/{cli}-block.toml`. It applies the block on a fresh branch, runs agents.py check, merges, and pulls the local checkout. Never edit ~/thoven/agent-skills directly.
5. Report to {report_to} with `{herdr} agent prompt {report_to} "<message>"`: either `WIRED {cli}: <launch line>, <n> models, <effort words>`, or `BLOCKED {cli}: <what you could not find>`. Then delete /tmp/{cli}-block.toml and /tmp/agents-probe.toml.

Stop and report BLOCKED rather than guess: a flag you cannot confirm on a real launch is the failure this exists to prevent.
