# Teacher guidance button for TinyMCE (tiny_edguidance)

Part of **teacher guidance** - see `local/edguidance/README.md` for the design, which covers all
three plugins.

Adds a **Teacher guidance** menu to the TinyMCE toolbar (and to the Insert menu):

* **Use a preset** > *title* - embeds a site preset, linked and read-only. No dialogue.
* **Start with a preset** > *title* - opens the guidance form pre-filled with a copy of the preset.
* **Start with blank** - opens the guidance form empty.
* **Edit this guidance** - when the cursor is on existing guidance (or click it).

The form is `local_edguidance\form\embed_form`, opened with `core_form/modalform`; the one-click path
is the `local_edguidance_embed_preset` web service. Either way the server returns a key, and all this
plugin ever puts in the text is the token for it. In the editor the token is drawn as a labelled,
non-editable chip; nothing but the bare token is saved.

The button is offered only to holders of `local/edguidance:manage`, only in an activity's editors, on
a section's *Edit section* page, or on the *add an activity* form, and never in an editor rendered
over AJAX - which is how it keeps out of the guidance editor inside its own modal.

The last two are both in the course context. On *Edit section* the plugin passes the section id to
the editor, which sends it with every call, so the block belongs to that section rather than being a
draft for an activity that does not exist yet.

Requires `local_edguidance`. Moodle 4.5 only. GNU GPL v3 or later.
