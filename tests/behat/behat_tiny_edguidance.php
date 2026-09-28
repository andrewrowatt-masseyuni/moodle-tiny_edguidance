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

/**
 * Steps for the teacher guidance editor button.
 *
 * @package    tiny_edguidance
 * @category   test
 * @copyright  2026 Andrew Rowatt <A.J.Rowatt@massey.ac.nz>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

use Behat\Mink\Exception\ExpectationException;

// NOTE: no MOODLE_INTERNAL test here, this file may be required by behat before including /config.php.
require_once(__DIR__ . '/../../../../tests/behat/editor_tiny_helpers.php');
require_once(__DIR__ . '/../../../../../../behat/behat_base.php');

/**
 * Steps for the teacher guidance editor button.
 *
 * The preview lives in each token's shadow root, which Mink's XPath cannot see into, so these read
 * it through the editor instead.
 *
 * @package    tiny_edguidance
 * @category   test
 * @copyright  2026 Andrew Rowatt <A.J.Rowatt@massey.ac.nz>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class behat_tiny_edguidance extends behat_base {
    use editor_tiny_helpers;

    /**
     * Check that the editor previews teacher guidance containing some text.
     *
     * @Then /^the "(?P<editor_string>(?:[^"]|\\")*)" TinyMCE editor should preview guidance "(?P<text_string>(?:[^"]|\\")*)"$/
     * @param string $locator The editor.
     * @param string $text The text.
     */
    public function the_editor_should_preview_guidance(string $locator, string $text): void {
        $this->require_tiny_tags();

        $editorid = $this->get_textarea_for_locator($locator)->getAttribute('id');
        $previews = $this->evaluate_javascript_for_editor($editorid, <<<EOF
            resolve(Array.from(instance.getBody().querySelectorAll('div[data-edguidance]'))
                .map((token) => token.shadowRoot?.querySelector('.tiny-edguidance-preview')?.textContent ?? '')
                .join('\\n'));
            EOF);

        if (!str_contains((string)$previews, $text)) {
            throw new ExpectationException(
                "The \"{$locator}\" editor previews no guidance containing \"{$text}\". It previews: {$previews}",
                $this->getSession()
            );
        }
    }

    /**
     * Check that what the editor would save does not contain some text.
     *
     * @Then /^the "(?P<editor_string>(?:[^"]|\\")*)" TinyMCE editor should not save "(?P<text_string>(?:[^"]|\\")*)"$/
     * @param string $locator The editor.
     * @param string $text The text.
     */
    public function the_editor_should_not_save(string $locator, string $text): void {
        $this->require_tiny_tags();

        $editorid = $this->get_textarea_for_locator($locator)->getAttribute('id');
        $content = (string)$this->evaluate_javascript_for_editor($editorid, 'resolve(instance.getContent());');

        if (str_contains($content, $text)) {
            throw new ExpectationException(
                "The \"{$locator}\" editor would save \"{$text}\": {$content}",
                $this->getSession()
            );
        }
    }
}
