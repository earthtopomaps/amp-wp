( function( { ampUrl, isCustomizePreview, isAmpDevMode, noampQueryVarName, noampQueryVarValue, disabledStorageKey, mobileUserAgents, regexRegex } ) {
	if ( typeof sessionStorage === 'undefined' ) {
		return;
	}

	// Yes, this is a regular expression to match regular expressions. So meta.
	const regExpRegExp = new RegExp( regexRegex );

	// A user agent may be expressed as a RegExp string serialization in the the form of `/pattern/[i]*`. If a user
	// agent string does not match this pattern, then the string will be used as a simple string needle for the haystack.
	const isMobile = mobileUserAgents.some( ( pattern ) => {
		const matches = pattern.match( regExpRegExp ); // A regex for a regex. So meta.
		if ( matches ) {
			const re = new RegExp( matches[ 1 ], matches[ 2 ] );
			if ( re.test( navigator.userAgent ) ) {
				return true;
			}
		}
		return navigator.userAgent.includes( pattern );
	} );

	// If not mobile, there's nothing left to do.
	if ( ! isMobile ) {
		return;
	}

	document.addEventListener( 'DOMContentLoaded', () => {
		// Show the mobile version switcher link once the DOM has loaded.
		const siteVersionSwitcher = document.getElementById( 'amp-mobile-version-switcher' );
		if ( ! siteVersionSwitcher ) {
			return;
		}

		// Show the link to return to the mobile version of the site since it is hidden by default when client-side
		// redirection is enabled, since JS is used to determine whether it is a mobile browser.
		siteVersionSwitcher.hidden = false;

		// Re-enable mobile redirection when navigating back to the mobile version of the site.
		const link = siteVersionSwitcher.querySelector( 'a[href]' );
		if ( link ) {
			link.addEventListener( 'click', () => {
				sessionStorage.removeItem( disabledStorageKey );
			} );
		}
	} );

	// Short-circuit if mobile redirection is disabled.
	const isPairedBrowsing = isAmpDevMode && [ 'paired-browsing-non-amp', 'paired-browsing-amp' ].includes( window.name );
	if ( sessionStorage.getItem( disabledStorageKey ) || isCustomizePreview || isPairedBrowsing ) {
		return;
	}

	const url = new URL( location.href );

	if ( url.searchParams.has( noampQueryVarName ) && noampQueryVarValue === url.searchParams.get( noampQueryVarName ) ) {
		// If the noamp query param is present, remember that redirection should be disabled.
		sessionStorage.setItem( disabledStorageKey, '1' );
	} else {
		// Otherwise, since JS is running then we know it's not an AMP page and we need to redirect to the AMP version.
		window.stop(); // Stop loading the page! This should cancel all loading resources.

		// Replace the current page with the AMP version.
		location.replace( ampUrl );
	}
}(
	// Note: The argument here is replaced with JSON in PHP by \AmpProject\AmpWP\MobileRedirection::add_mobile_redirect_script().
	AMP_MOBILE_REDIRECTION,
) );
