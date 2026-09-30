# Teacher guidance button for TinyMCE (tiny_edguidance)

Part of **teacher guidance** - see `local/edguidance/README.md` for the design, which covers all
three plugins.

Adds a **Teacher guidance** menu to the TinyMCE toolbar (and to the Insert menu). For a teacher who
may write guidance (`local/edguidance:manage`, managers by default):

* **Use a preset** > *title* - embeds a site preset, linked and read-only. No dialogue.
* **Start with a preset** > *title* - opens the guidance form pre-filled with a copy of the preset.
* **Start with blank** - opens the guidance form empty.
* **Edit this guidance** - when the cursor is on existing guidance (or click it). The form's footer
  also has **Delete**, which warns first that the guidance goes for every teacher once the text is
  saved, and then takes the token out of the text in one undo step; and, for guidance you have
  marked as read (or, for a task, as complete), **Restore**. The form also sets the guidance's
  category - note, recommendation, task or optional task - and an optional heading.

For anyone else who may read guidance - an editing teacher, by default - the plugin still shows
guidance in the editor and keeps it whole, but offers only **Show guidance marked as read**. With
`local/edguidance:tick` they can tick its checklists, and mark it as read or complete (or restore
it), in the preview itself; clicking it does not open the form, and there are no move arrows.

In the guidance editor itself, inside the form, the same button offers only **Add task**, which
writes `[ ] Task name` on a new line with *Task name* selected.

The form is `local_edguidance\form\embed_form`, opened with `core_form/modalform`; the one-click path
is the `local_edguidance_embed_preset` web service. Either way the server returns a key, and all this
plugin ever puts in the text is the token for it.

In the editor each token shows its guidance as the page will, rendered by the
`local_edguidance_get_previews` web service and styled with the page's own theme stylesheets, which
the editor is given in its configuration. The preview goes in a shadow root attached to the token,
never inside it, so it is never part of the saved text; a serializer filter also saves every token
empty, whatever is in it. Hovering over a token shows up and down buttons at its bottom right,
also in the shadow root, that move it past the block before or after it. See *The preview in the
editor* in `local/edguidance/README.md`. Guidance you have marked as read shows nothing, until you
choose **Show guidance marked as read** from the menu (offered only while some is hidden); then, in
that editor until you leave the page, it shows in full over a light hatch, marked *Marked as read*
or, for a task, *Marked as complete*.

The plugin is on only for people who may read guidance, only in an activity's editors, on a
section's *Edit section* page, or on the *add an activity* form - and in the guidance editor, which
`embed_form::is_rendering()` picks out, for people who may write guidance. Never in any other editor
rendered over AJAX.

The last two are both in the course context. On *Edit section* the plugin passes the section id to
the editor, which sends it with every call, so the block belongs to that section rather than being a
draft for an activity that does not exist yet.

Requires `local_edguidance`. Moodle 4.5 only. GNU GPL v3 or later.
