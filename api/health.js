const express = require('express');
const cheerio = require('cheerio');
const cors = require('cors');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors()); 
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Enhanced proxy route with multiple provider support
app.get('/proxy/:provider', async (req, res) => {
  const { provider } = req.params;
  const { id, tmdb, type = 'movie' } = req.query;
  
  if (!id) return res.status(400).json({ error: "Missing movie/show ID" });

  let targetUrl;
  
  // Support multiple provider
  switch (provider) {
    case 'vidsrc':
    case 'vidsrc-to':
      targetUrl = `https://vidsrc.to/embed/${type}/${id}`;
      break;
    case 'vidsrc-me':
      targetUrl = `https://vidsrc.me/embed/${type}?tmdb=${tmdb || id}`;
      break;
    default:
      return res.status(400).json({ error: "Unsupported provider. Use 'vidsrc', 'vidsrc-to', or 'vidsrc-me'" });
  }

  try {
    console.log(`🔄 Fetching: ${targetUrl}`);
    
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Referer': 'https://google.com'
      },
      timeout: 10000
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    let html = await response.text();
    const $ = cheerio.load(html);

    // Look for div element with id "the_frame" instead of video element
    const frameElement = $('#player_iframe');
    
    if (frameElement.length > 0) {
      console.log('✅ Found player_iframe element, serving clean frame content');
      
      const cleanFrameHtml = createCleanFrameHTML(frameElement, $);
      
      res.set({
        'Content-Type': 'text/html',
        'Content-Security-Policy': "script-src 'unsafe-inline'; object-src 'none'; frame-ancestors *;",
        'X-Frame-Options': 'ALLOWALL'
      });
      
      return res.send(cleanFrameHtml);
    }

    // Enhanced ad removal and cleanup
    console.log('🧹 No the_frame element found, cleaning full page');
    
    const cleanedHtml = await cleanEmbedContent($, targetUrl);
    
    res.set({
      'Content-Type': 'text/html',
      'Content-Security-Policy': "script-src 'self' 'unsafe-inline'; object-src 'none'; frame-ancestors *;",
      'X-Frame-Options': 'ALLOWALL'
    });
    
    res.send(cleanedHtml);

  } catch (error) {
    console.error(`❌ Proxy error for ${provider}:`, error.message);
    res.status(500).json({ 
      error: "Failed to fetch or clean video content",
      details: error.message,
      provider,
      targetUrl
    });
  }
});

// Function to create clean frame HTML
function createCleanFrameHTML(frameElement, $) {
  const frameHtml = $('<div></div>').append(frameElement.clone()).html();
  
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            background: #000;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            font-family: Arial, sans-serif;
          }
          #player_iframe {
            width: 100%;
            height: 100%;
            max-width: 100%;
            max-height: 100%;
          }
          /* Hide any potential iframe or video elements that might contain ads */
          iframe[src*="ads"], iframe[src*="googletagmanager"], iframe[src*="doubleclick"] {
            display: none !important;
          }
          /* Override specific styling mentioned */
          .mctitle a {
            font-size: inherit !important;
          }
          #AdWidgetContainer,
          #ad720,
          #onexbet {
            display: none !important;
            visibility: hidden !important;
            opacity: 0 !important;
            width: 0 !important;
            height: 0 !important;
            position: static !important;
            pointer-events: none !important;
          }
          div.servers#hidden {
            display: none !important;
          }
          .ad_container {
            display: none !important;
          }
        </style>
      </head>
      <body>
          ${frameHtml}
        <script>
          // Remove debugger statements and prevent debugging
          const originalDebugger = window.debugger;
          Object.defineProperty(window, 'debugger', {
            get: () => undefined,
            set: () => {},
            configurable: false
          });
          
          // Override console methods that might trigger debugging
          const originalConsole = { ...console };
          console.debug = () => {};
          console.trace = () => {};
          
          // Hide loading when content loads
          setTimeout(() => {
            const loading = document.getElementById('loading');
            if (loading) {
              loading.style.display = 'none';
            }
          }, 2000);
          
          // Enhanced popup blocking
          window.open = () => null;
          window.alert = () => null;
          window.confirm = () => null;
          window.prompt = () => null;
          
          // Block debugging attempts
          setInterval(() => {
            if (window.console && window.console.clear) {
              // Don't actually clear console in case it's needed for legitimate debugging
            }
          }, 100);
          
          // Override debugging functions
          window.eval = () => undefined;
          
          window.aclib = {
            runPop: () => null,
            runInPagePush: () => null,
            runInterstitial: () => null,
            runClickPop: () => null
          };
          
          // Remove specific elements function
          function removeSpecificElements() {
            // Remove by ID
            const elementsToRemove = ['AdWidgetContainer', 'ad720', 'onexbet'];
            elementsToRemove.forEach(id => {
              const element = document.getElementById(id);
              if (element) {
                element.remove();
              }
            });
            
            // Remove servers div with hidden id
            const serversDiv = document.querySelector('div.servers#hidden');
            if (serversDiv) {
              serversDiv.remove();
            }
            
            // Remove specific scripts
            const scriptsToRemove = document.querySelectorAll('script[src*="histats.com"], script[src*="f59d610a61063c7ef3ccdc1fd40d2ae6.js"]');
            scriptsToRemove.forEach(script => script.remove());
            
            // Clean mctitle styling
            const mctitleLinks = document.querySelectorAll('.mctitle a');
            mctitleLinks.forEach(link => {
              link.style.fontSize = '';
            });
          }
          
          // Run immediately
          removeSpecificElements();
          
          // Run periodically
          setInterval(removeSpecificElements, 1000);
          
          // Prevent right-click context menu that might contain debugging options
          document.addEventListener('contextmenu', (e) => {
            e.preventDefault();
          });
          
          // Prevent F12 and other debugging shortcuts
          document.addEventListener('keydown', (e) => {
            if (e.key === 'F12' || 
                (e.ctrlKey && e.shiftKey && e.key === 'I') ||
                (e.ctrlKey && e.shiftKey && e.key === 'C') ||
                (e.ctrlKey && e.shiftKey && e.key === 'J') ||
                (e.ctrlKey && e.key === 'u')) {
              e.preventDefault();
            }
          });
        </script>
      </body>
    </html>
  `;
}

// Enhanced content cleaning function
async function cleanEmbedContent($, baseUrl) {
  // Comprehensive ad removal selectors
  const adSelectors = [
    // Script-based ads
    'script[src*="ads"]',
    'script[src*="adsystem"]',
    'script[src*="doubleclick"]',
    'script[src*="googlesyndication"]',
    'script[src*="googletagmanager"]',
    'script[src*="amazon-adsystem"]',
    'script[src*="popads"]',
    'script[src*="popcash"]',
    'script[src*="propellerads"]',
    'script[src*="adnxs"]',
    'script[src*="adskeeper"]',
    'script[src*="mgid"]',
    'script[src*="outbrain"]',
    'script[src*="taboola"]',
    'script[src*="histats.com"]',
    'script[src*="f59d610a61063c7ef3ccdc1fd40d2ae6.js"]',
    
    // Iframe ads
    'iframe[src*="ads"]',
    'iframe[src*="googletagmanager"]',
    'iframe[src*="doubleclick"]',
    
    // Element-based ads
    'div[class*="ad"]',
    'div[id*="ad"]',
    'div[class*="banner"]',
    'div[id*="banner"]',
    '.advertisement',
    '.ad-container',
    '.popup',
    '.modal',
    '.overlay',
    '[data-ad-slot]',
    
    // Links and buttons
    'a[href*="sponsor"]',
    'a[href*="promo"]',
    'a[href*="affiliate"]',
    
    // OVERLAY BLOCKING ELEMENTS
    'div[id*="dontfoid"]',
    'div[znid]',
    'div[style*="position: fixed"][style*="z-index: 2147483647"]',
    'div[style*="position: fixed"][style*="background-color: transparent"]',
    'div[style*="position: fixed"][style*="top: 0"][style*="left: 0"]',
    'div[style*="z-index: 2147483647"]',
    'div[style*="z-index: 999999"]',
    'div[style*="z-index: 9999999"]',
    
    // Click interceptors
    'div[onclick*="open"]',
    'div[onclick*="popup"]',
    'a[onclick*="open"]',
    'a[onclick*="popup"]',
    '[onmousedown*="open"]',
    '[onmouseup*="open"]',
    '[onclick*="aclib"]',
    '[onclick*="popunder"]'
  ];

  // Remove ad elements
  let removedCount = 0;
  adSelectors.forEach(selector => {
    const elements = $(selector);
    removedCount += elements.length;
    elements.remove();
  });

  console.log(`🗑️ Removed ${removedCount} ad-related elements`);

  // SPECIFIC OVERLAY REMOVAL
  console.log('🗑️ Removing overlay blocking elements...');
  
  // Remove specific overlay elements
  $('div[id*="dontfoid"]').remove();
  $('div[znid]').remove();
  $('div[style*="z-index: 2147483647"]').remove();
  
  // Remove any fixed position transparent overlays
  $('div').each(function() {
    const style = $(this).attr('style');
    if (style && 
        style.includes('position: fixed') && 
        style.includes('z-index: 2147483647') &&
        style.includes('background-color: transparent')) {
      $(this).remove();
    }
  });

  // Remove high z-index elements that might be overlays
  $('div').each(function() {
    const style = $(this).attr('style');
    if (style && style.includes('z-index:') && 
        (style.includes('2147483647') || style.includes('999999'))) {
      $(this).remove();
    }
  });

  console.log('✅ Overlay blocking elements removed');

  // SPECIFIC REMOVALS REQUESTED
  console.log('🗑️ Removing specific styling and elements...');

  // 1. Remove specific CSS styling rules
  $('style').each(function() {
    let styleContent = $(this).html();
    if (styleContent) {
      // Remove the specific CSS rules
      const rulesToRemove = [
        /\.mctitle\s+a\s*\{[^}]*\}/g,
        /#AdWidgetContainer\s*\{[^}]*\}/g,
        /#ad720\s*\{[^}]*\}/g,
        /#ad720\s+\.ad_container\s*\{[^}]*\}/g,
        /#ad720\s+\.ad_container\s+img\s*\{[^}]*\}/g,
        /#ad720\s+\.ad_container\s+#close\s*\{[^}]*\}/g,
        /#ad720\s+\.ad_container\s+#close:hover\s*\{[^}]*\}/g,
        /#onexbet\s*\{[^}]*\}/g,
        /#onexbet\s+img\s*\{[^}]*\}/g
      ];
      
      rulesToRemove.forEach(rule => {
        styleContent = styleContent.replace(rule, '');
      });
      
      $(this).html(styleContent);
    }
  });

  // 2. Remove specific scripts
  $('script[src*="histats.com"]').remove();
  $('script[src="https://s10.histats.com/js15_as.js"]').remove();
  $('script[src="/f59d610a61063c7ef3ccdc1fd40d2ae6.js?_=1752438208"]').remove();
  $('script[src*="f59d610a61063c7ef3ccdc1fd40d2ae6.js"]').remove();

  // 3. Remove div with class "servers" and id "hidden"
  $('div.servers#hidden').remove();
  $('div[class="servers"][id="hidden"]').remove();

  // 4. Remove specific elements by ID
  $('#AdWidgetContainer').remove();
  $('#ad720').remove();
  $('#onexbet').remove();

  // 5. Clean up mctitle styling
  $('.mctitle').find('a').css('font-size', '');

  console.log('✅ Specific styling and elements removed');

  // Remove all onclick and event attributes
  $('*').each(function() {
    $(this).removeAttr('onclick');
    $(this).removeAttr('onmousedown');
    $(this).removeAttr('onmouseup');
    $(this).removeAttr('onfocus');
    $(this).removeAttr('onblur');
    $(this).removeAttr('oncontextmenu');
  });

  // Remove javascript: links
  $('a[href^="javascript:"]').each(function() {
    $(this).removeAttr('href');
  });

  // Remove scripts with suspicious content AND debugger statements
  let removedScripts = 0;
  $('script').each(function() {
    const scriptContent = $(this).html();
    const scriptSrc = $(this).attr('src');
    
    if (scriptContent && (
      scriptContent.includes('debugger') ||
      scriptContent.includes('aclib.runPop') ||
      scriptContent.includes('aclib.runInPagePush') ||
      scriptContent.includes('popunder') ||
      scriptContent.includes('popup') ||
      scriptContent.includes('advertisement') ||
      scriptContent.includes('adsystem') ||
      scriptContent.includes('googletag') ||
      scriptContent.includes('pbjs') ||
      scriptContent.includes('window.open') ||
      scriptContent.includes('dontfoid') ||
      scriptContent.includes('znid')
    )) {
      $(this).remove();
      removedScripts++;
    }
    
    // Remove external suspicious scripts
    if (scriptSrc && (
      scriptSrc.includes('popads') ||
      scriptSrc.includes('popcash') ||
      scriptSrc.includes('propellerads') ||
      scriptSrc.includes('histats.com') ||
      scriptSrc.includes('f59d610a61063c7ef3ccdc1fd40d2ae6.js')
    )) {
      $(this).remove();
      removedScripts++;
    }
  });

  console.log(`🗑️ Removed ${removedScripts} suspicious scripts`);

  // Fix relative URLs to absolute
  $('link[href], script[src], img[src], iframe[src]').each(function() {
    const element = $(this);
    const attr = element.attr('href') || element.attr('src');
    if (attr && attr.startsWith('/') && !attr.startsWith('//')) {
      const absoluteUrl = new URL(attr, baseUrl).toString();
      if (element.attr('href')) {
        element.attr('href', absoluteUrl);
      } else {
        element.attr('src', absoluteUrl);
      }
    }
  });

  // Enhanced popup blocking script with debugger prevention
  const enhancedBlockingScript = `
    <script>
      // Enhanced popup blocking
      window.aclib = {
        runPop: () => null,
        runInPagePush: () => null,
        runInterstitial: () => null,
        runClickPop: () => null
      };
      
      // Block all popup attempts
      window.open = () => null;
      window.alert = () => null;
      window.confirm = () => null;
      window.prompt = () => null;
      
      // Block focus events that trigger popups
      window.focus = () => null;
      window.blur = () => null;
      
      // Override eval and Function constructor
      window.eval = () => undefined;
      window.Function = () => () => {};
      
      // Prevent debugging
      const originalDebugger = window.debugger;
      Object.defineProperty(window, 'debugger', {
        get: () => undefined,
        set: () => {},
        configurable: false
      });
      
      // Override console methods that might trigger debugging
      console.debug = () => {};
      console.trace = () => {};
      
      // Remove specific elements function
      function removeSpecificElements() {
        // Remove by ID
        const elementsToRemove = ['AdWidgetContainer', 'ad720', 'onexbet'];
        elementsToRemove.forEach(id => {
          const element = document.getElementById(id);
          if (element) {
            element.remove();
          }
        });
        
        // Remove servers div with hidden id
        const serversDiv = document.querySelector('div.servers#hidden');
        if (serversDiv) {
          serversDiv.remove();
        }
        
        // Remove specific scripts
        const scriptsToRemove = document.querySelectorAll('script[src*="histats.com"], script[src*="f59d610a61063c7ef3ccdc1fd40d2ae6.js"]');
        scriptsToRemove.forEach(script => script.remove());
        
        // Clean mctitle styling
        const mctitleLinks = document.querySelectorAll('.mctitle a');
        mctitleLinks.forEach(link => {
          link.style.fontSize = '';
        });
      }
      
      // Run immediately
      removeSpecificElements();
      
      // Block event propagation on suspicious elements
      document.addEventListener("click", function(e) {
        if (e.target.classList.contains('ad') || 
            e.target.id.includes('ad') || 
            e.target.classList.contains('popup') ||
            e.target.id.includes('dontfoid') ||
            e.target.hasAttribute('znid') ||
            e.target.id === 'AdWidgetContainer' ||
            e.target.id === 'ad720' ||
            e.target.id === 'onexbet') {
          e.stopPropagation();
          e.preventDefault();
        }
      }, true);
      
      document.addEventListener("mousedown", function(e) {
        if (e.target.classList.contains('ad') || 
            e.target.id.includes('ad') ||
            e.target.id.includes('dontfoid') ||
            e.target.hasAttribute('znid') ||
            e.target.id === 'AdWidgetContainer' ||
            e.target.id === 'ad720' ||
            e.target.id === 'onexbet') {
          e.stopPropagation();
          e.preventDefault();
        }
      }, true);
      
      // Remove any dynamically added ads and overlays
      const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
          mutation.addedNodes.forEach(function(node) {
            if (node.nodeType === 1) { // Element node
              if (node.classList && (
                node.classList.contains('ad') ||
                node.classList.contains('popup') ||
                node.classList.contains('modal') ||
                node.id.includes('dontfoid') ||
                node.hasAttribute('znid') ||
                node.id === 'AdWidgetContainer' ||
                node.id === 'ad720' ||
                node.id === 'onexbet' ||
                (node.classList.contains('servers') && node.id === 'hidden')
              )) {
                node.remove();
              }
              
              // Remove high z-index overlays
              const style = node.style;
              if (style && style.zIndex && 
                  (style.zIndex === '2147483647' || style.zIndex === '999999')) {
                node.remove();
              }
              
              // Remove specific scripts
              if (node.tagName === 'SCRIPT' && node.src && 
                  (node.src.includes('histats.com') || node.src.includes('f59d610a61063c7ef3ccdc1fd40d2ae6.js'))) {
                node.remove();
              }
            }
          });
        });
      });
      
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
      
      // Continuously remove overlay elements and specific elements
      setInterval(() => {
        const overlays = document.querySelectorAll('div[id*="dontfoid"], div[znid]');
        overlays.forEach(overlay => overlay.remove());
        
        // Run specific removals
        removeSpecificElements();
      }, 100);
    </script>
  `;

  // Enhanced CSS for hiding ads and improving layout
  const enhancedCSS = `
    <style>
      /* Hide ad-related elements */
      .ad, .ads, .advertisement, .ad-container, .ad-banner,
      [class*="ad-"], [id*="ad-"], [class*="popup"], [class*="modal"],
      [class*="overlay"], [class*="banner"], .sponsor, .promo,
      div[id*="dontfoid"], div[znid] {
        display: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
        width: 0 !important;
        height: 0 !important;
        pointer-events: none !important;
      }
      
      /* Hide high z-index overlays */
      div[style*="z-index: 2147483647"],
      div[style*="z-index: 999999"],
      div[style*="z-index: 9999999"] {
        display: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
      }
      
      /* Override specific styling mentioned */
      .mctitle a {
        font-size: inherit !important;
      }
      
      #AdWidgetContainer,
      #ad720,
      #onexbet {
        display: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
        width: 0 !important;
        height: 0 !important;
        position: static !important;
        pointer-events: none !important;
      }
      
      /* Hide servers div with hidden id */
      div.servers#hidden {
        display: none !important;
      }
      
      /* General cleanup */
      .ad_container {
        display: none !important;
      }
      
      /* Improve content display */
      body {
        margin: 0;
        padding: 0;
        background: #000;
        overflow-x: hidden;
      }
      
      iframe {
        max-width: 100%;
        border: none;
        pointer-events: auto !important;
      }
      
      /* Ensure the_frame is properly displayed */
      #the_frame {
        width: 100% !important;
        height: 100% !important;
        max-width: 100% !important;
        max-height: 100% !important;
      }
      
      /* Remove any floating elements that might be ads */
      *[style*="position: fixed"] {
        position: static !important;
      }
      
      /* Prevent click hijacking */
      * {
        pointer-events: auto !important;
      }
      
      /* Hide transparent overlays */
      div[style*="background-color: transparent"][style*="position: fixed"] {
        display: none !important;
      }
    </style>
  `;

  // Add enhancements to head
  $('head').append(enhancedCSS);
  $('head').append(enhancedBlockingScript);

  // Add viewport meta if not present
  if (!$('meta[name="viewport"]').length) {
    $('head').prepend('<meta name="viewport" content="width=device-width, initial-scale=1.0">');
  }

  return $.html();
}

// Backward compatibility route
app.get('/proxy/vidsrc', async (req, res) => {
  req.params.provider = 'vidsrc-to';
  return app._router.handle(req, res);
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Not found',
    availableEndpoints: [
      'GET /health',
      'GET /proxy/vidsrc?id=MOVIE_ID',
      'GET /proxy/vidsrc-to?id=MOVIE_ID&type=movie',
      'GET /proxy/vidsrc-me?id=MOVIE_ID&tmdb=TMDB_ID&type=movie'
    ]
  });
});

app.listen(PORT, () => {
  console.log(`✅ Enhanced video proxy server running at http://localhost:${PORT}`);
  console.log(`📋 Available endpoints:`);
  console.log(`   - GET /health`);
  console.log(`   - GET /proxy/vidsrc?id=MOVIE_ID`);
  console.log(`   - GET /proxy/vidsrc-to?id=MOVIE_ID&type=movie`);
  console.log(`   - GET /proxy/vidsrc-me?id=MOVIE_ID&tmdb=TMDB_ID&type=movie`);
});