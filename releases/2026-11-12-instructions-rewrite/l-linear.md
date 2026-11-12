# l-linear: Linear templates and setup documents, applied 2026-11-12

Result: PASS. Every write was read back through GraphQL and compared with what was sent.
Backup of everything before the first write: `applied/linear-before.json` (8 templates with full
`templateData`, the 3 teams' default-template settings, and the full bodies of "Project setup
standard" and "Project setup learnings").

## Path taken: create the workspace set, update the team copies (not a move)

Linear does allow a move: `TemplateUpdateInput.teamId` says "Null moves a team template to the
workspace". I did not use it, for three reasons found before writing:

1. DEP is a sub-team of THV. Its three issue templates and its project template are inherited
   copies (`inheritedFrom` = the THV template). Linear's sub-team docs say inherited templates
   that lose their parent can be "permanently removed". Moving the THV source could have deleted
   the DEP copies, and the brief says delete nothing.
2. THV's `defaultTemplateForMembers` points at the THV "Work item" (`5d11af0a`), and its
   `defaultProjectTemplate` at the THV "Thoven project" (`b885e2bd`). A move could clear those
   settings, and team settings are outside my write list, so I could not have put them back.
3. The THV issue templates preset a THV `stateId`. The docs say a workspace template cannot preset
   team properties such as statuses.

So I created a workspace set and wrote the same approved body into each THV team copy. The DEP
copies picked up the new bodies from their THV parents on their own (read back: identical). I
made no write to DEP.

## What exists now

Workspace scope (`team: null`; `list_templates` for LAB, a team with no templates of its own,
returns all seven with `scope: workspace`):

| Template | Type | Id | Read-back |
|---|---|---|---|
| Spec | document | `47815450-f99b-49c4-8a94-80c68b7357fe` | identical to grill §3 |
| Architecture | document | `2994a7e1-a733-4f40-8de3-600a2283d92c` | identical, except Linear renders the table rule `\|---\|` as `\| -- \|` |
| Log | document | `a567fcea-8807-4ede-93b4-6b307ab1cd06` | identical (I removed one link Linear added to "claude.ai" on its own) |
| Build | issue | `b0737788-2a77-429d-b3ed-a9fcbc629ab2` | identical to grill §3, plus one line (see Adapted) |
| Work item | issue | `ae124a2c-d7b5-4a94-8062-c15bdaae8496` | identical to linear.md Change 5 |
| Bug | issue | `51d4b761-683d-4edd-b9a5-108f8f5c3cc2` | identical to Change 6 applied to the old body |
| Brainstorm | issue | `dfaaf005-1d4e-4114-a17e-cdb557abc78f` | identical to Change 7 appended to the old body |

Team scope, updated in place (ids unchanged; `stateId`, `teamId` and `priority` kept):

| Template | THV id (written) | DEP id (inherited, synced) | Read-back |
|---|---|---|---|
| Work item | `5d11af0a-…` | `c617a408-…` | identical to the workspace body, on both teams |
| Bug | `d02be5cf-…` | `add73220-…` | identical, on both teams |
| Brainstorm | `5e109c98-…` | `dfa61f87-…` | identical, on both teams |
| Thoven project | `b885e2bd-…` | `dbc5ef88-…` | Change 8's two sections in; statusId, teamIds, leadTeamId and summary unchanged; DEP identical |

Team default settings, unchanged: THV members get the THV "Work item" (`5d11af0a`), which now
carries the approved body. THV's default project template is the THV "Thoven project"
(`b885e2bd`). DEP and LAB have no defaults.

Documents (full-content `documentUpdate`, read-modify-write):

| Document | Id | Words | Read-back |
|---|---|---|---|
| Project setup standard | `28680f01-46bf-416e-a70b-2b47a1000ef8` | 1,155 → 1,218 | identical, except Linear stripped `<>` from one internal link it already held |
| Project setup learnings | `78f5580b-265e-4db9-81b0-d28dd4ffbdf1` | 878 → 931 | identical, except the same `<>` stripping on four existing internal links |

Both documents were unchanged between my backup and my write (I checked the content again just
before writing).

## Applied, adapted, not applied

| Change | Status |
|---|---|
| 1 Spec, 2 Architecture, 3 Log (document templates) | Applied. Each title (`Spec · [Project]` and so on) went into the template's title field, not the body |
| 4 Build | Adapted: the line "The whole ticket is 400 words at most." sits outside the template block in the grill text, so I added it as a final placeholder line `[The whole ticket is 400 words at most.]` and put it in the template's description. `Writes to:` is still the first line. "Default status Todo" was not set, because a workspace template cannot preset a team status |
| 5 Work item | Applied. Adapted: the template description said "Use Research, Design, Build…". It now says "Research, Design, Plan, Review or Spec work. Build work uses the Build template." |
| 6 Bug | Applied. Title, What happens and Expected kept. The workspace copy has no Triage default (team status); THV's copy keeps its Triage default |
| 7 Brainstorm | Applied (appended after Starting points) |
| 8 Project template | Adapted: both sections replaced as drafted. I kept the two link lines under Sources of truth (setup standard, setup learnings), which the draft did not mention |
| 8 Setup standard | Applied: Key decisions and Sources of truth replaced as prose under the existing `###` headings, and "How templates and documents are used" plus "Native issue templates" replaced by the drafted block. Adapted with two facts: "each made from its **workspace** document template", and "These are workspace templates, available on every team." under Native issue templates |
| 8 linear-project SKILL.md lines | Not mine (skill file, no edit rights here) |
| Learnings line | Applied: one dated entry, "Document templates now exist", that says why and points at the standard |

## How document templates take a body (found by testing on the new Spec template)

- A document template's body is `templateData.descriptionData`, a ProseMirror document. A
  `content`, `description` or `contentData` key is stored without complaint but applies nothing:
  `Template.content` comes back empty. I tested these keys on Spec before its final write.
- To get Linear's own conversion from markdown, I wrote each document body once into the new,
  unused workspace Build template as `description`, read back its `descriptionData`, and then wrote
  Build's real body again (read-back identical).
- `get_template` on the connector returns a document template's body under `content.description`.
- `DocumentCreateInput.lastAppliedTemplateId` "does not apply the template's content". This
  confirms the standard's sentence that the connector, and the API too, cannot apply a document
  template.

## What I could not do

- Make each team see only one set. THV and DEP now show two copies of Work item, Bug and
  Brainstorm (the workspace copy and the team copy, with the same body). Removing the team copies
  needs an archive or delete, which the brief forbids, and THV's default would first have to point
  at the workspace Work item, which is a team setting outside my list.
- "Thoven project" is still a THV team template (DEP inherits it). LAB has no project template.
  I did not move it, for reasons 1 and 2 above.

## Connector question

Neither tool's description says what the result contains. `save_document` says only "Create or
update a Linear document"; `save_issue` says only "Create or update a Linear issue". The Linear
docs search ("MCP server save_document save_issue response") turned up nothing about the result.
From the description and the docs alone, the answer is not documented. I made no write to find
out.

## Scratch

Working files were in `/tmp/l-linear/` (no key inside; the key was read from `~/.linear-api-key`
at run time and never printed or written). Deleted after this report.
