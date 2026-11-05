<?php
declare(strict_types=1);

/** Inert SSR shell. Only a published target language list may populate it in the client. */
function render_language_shell(): void {
    ?>
    <details class="flag-language" data-flag-language hidden inert>
      <summary class="flag-language__trigger" aria-label="Dil değiştir" title="Dil değiştir">
        <span class="flag-language__cloth flag-language__cloth--active" data-language-active></span>
        <span class="flag-language__chevron" aria-hidden="true"></span>
      </summary>
      <div class="flag-language__menu">
        <form method="get" class="flag-language__choices" aria-label="Dil değiştir" data-language-choices></form>
      </div>
    </details>
    <?php
}
