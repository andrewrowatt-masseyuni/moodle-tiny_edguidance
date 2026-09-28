<?php
// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <http://www.gnu.org/licenses/>.

namespace tiny_edguidance;

/**
 * Tests for where the teacher guidance button is offered.
 *
 * @package    tiny_edguidance
 * @copyright  2026 Andrew Rowatt <A.J.Rowatt@massey.ac.nz>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 * @covers     \tiny_edguidance\plugininfo
 */
final class plugininfo_test extends \advanced_testcase {
    /**
     * Offered in an activity to people who may write guidance, and to nobody else.
     */
    public function test_activity_editors(): void {
        $this->resetAfterTest();
        $course = $this->getDataGenerator()->create_course();
        $book = $this->getDataGenerator()->create_module('book', ['course' => $course->id]);
        $context = \context_module::instance($book->cmid);

        $this->setUser($this->getDataGenerator()->create_and_enrol($course, 'editingteacher'));
        $this->assertTrue(plugininfo::is_enabled($context, [], []));

        $this->setUser($this->getDataGenerator()->create_and_enrol($course, 'teacher'));
        $this->assertFalse(plugininfo::is_enabled($context, [], []));

        $this->setUser($this->getDataGenerator()->create_and_enrol($course, 'student'));
        $this->assertFalse(plugininfo::is_enabled($context, [], []));
    }

    /**
     * In a course context only on the "add an activity" form, where the description comes first.
     */
    public function test_course_editors_only_when_adding_an_activity(): void {
        global $PAGE;

        $this->resetAfterTest();
        $course = $this->getDataGenerator()->create_course();
        $context = \context_course::instance($course->id);
        $this->setUser($this->getDataGenerator()->create_and_enrol($course, 'editingteacher'));

        $PAGE->set_url(new \moodle_url('/course/edit.php', ['id' => $course->id]));
        $this->assertFalse(plugininfo::is_enabled($context, [], []));

        $PAGE = new \moodle_page();
        $PAGE->set_url(new \moodle_url('/course/modedit.php', ['add' => 'quiz', 'course' => $course->id]));
        $this->assertTrue(plugininfo::is_enabled($context, [], []));
    }

    /**
     * On a section's edit page, for that section's summary, and the client is told which section.
     */
    public function test_section_summary_editor(): void {
        global $PAGE;

        $this->resetAfterTest();
        $course = $this->getDataGenerator()->create_course();
        $other = $this->getDataGenerator()->create_course();
        $context = \context_course::instance($course->id);
        $section = get_fast_modinfo($course)->get_section_info(1);

        $this->setUser($this->getDataGenerator()->create_and_enrol($course, 'editingteacher'));
        $PAGE->set_url(new \moodle_url('/course/editsection.php', ['id' => $section->id]));
        $this->assertTrue(plugininfo::is_enabled($context, [], []));
        $this->assertSame(
            (int)$section->id,
            plugininfo::get_plugin_configuration_for_context($context, [], [])['sectionid']
        );

        $this->setUser($this->getDataGenerator()->create_and_enrol($course, 'teacher'));
        $this->assertFalse(plugininfo::is_enabled($context, [], []));

        // A section id that is not in this course's context is no section at all.
        $this->setAdminUser();
        $PAGE = new \moodle_page();
        $PAGE->set_url(new \moodle_url('/course/editsection.php', ['id' => get_fast_modinfo($other)->get_section_info(1)->id]));
        $this->assertFalse(plugininfo::is_enabled($context, [], []));
        $this->assertSame(0, plugininfo::get_plugin_configuration_for_context($context, [], [])['sectionid']);
    }

    /**
     * Never anywhere else: site settings, the front page, a user's profile.
     */
    public function test_other_contexts(): void {
        $this->resetAfterTest();
        $this->setAdminUser();

        $this->assertFalse(plugininfo::is_enabled(\context_system::instance(), [], []));
        $this->assertFalse(plugininfo::is_enabled(\context_course::instance(SITEID), [], []));
        $this->assertFalse(plugininfo::is_enabled(\context_user::instance(get_admin()->id), [], []));
    }

    /**
     * Not for a front page section, though it is edited on the same page as any other.
     */
    public function test_front_page_sections(): void {
        global $CFG, $PAGE;

        require_once($CFG->dirroot . '/course/lib.php');

        $this->resetAfterTest();
        $this->setAdminUser();
        course_create_sections_if_missing(SITEID, [1]);

        $PAGE->set_url(new \moodle_url('/course/editsection.php', ['id' => get_fast_modinfo(SITEID)->get_section_info(1)->id]));
        $this->assertFalse(plugininfo::is_enabled(\context_course::instance(SITEID), [], []));
    }

    /**
     * The menu is given the presets in use, and only those.
     */
    public function test_configuration_lists_presets(): void {
        $this->resetAfterTest();
        $generator = $this->getDataGenerator()->get_plugin_generator('local_edguidance');
        $generator->set_preset(2, 'Due dates', '<p>Set them.</p>');
        $generator->set_preset(4, 'Q&A sessions', '<p>Book a room.</p>');
        $generator->set_preset(5, 'Unfinished', '');

        $config = plugininfo::get_plugin_configuration_for_context(\context_system::instance(), [], []);

        // Unescaped: TinyMCE shows menu text as text, so "&amp;" would reach the teacher literally.
        $this->assertSame([
            ['slot' => 2, 'title' => 'Due dates'],
            ['slot' => 4, 'title' => 'Q&A sessions'],
        ], $config['presets']);
    }

    /**
     * The preview is given the page's own theme stylesheets, not the editor's.
     */
    public function test_configuration_gives_the_page_stylesheets(): void {
        global $PAGE;

        $this->resetAfterTest();

        $config = plugininfo::get_plugin_configuration_for_context(\context_system::instance(), [], []);

        $this->assertNotEmpty($config['pagecss']);
        $this->assertSame(
            array_map(fn(\moodle_url $url): string => $url->out(false), $PAGE->theme->css_urls($PAGE)),
            $config['pagecss']
        );
        $this->assertNotContains($PAGE->theme->editor_css_url()->out(false), $config['pagecss']);
    }
}
