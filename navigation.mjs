// One mobile navigation shell for the main site and imported WhatsApp pages.
const destinations=[['/','Home'],['/memories','Memories'],['/people','Classmates'],['/reunion','Reunion'],['/wa/','WhatsApp']];
export const navigationLinks=current=>destinations.map(([href,label])=>`<a href="${href}"${href===current?' aria-current="page"':''}>${label}</a>`).join('');
export const mobileNavigation=current=>`<nav class="app-bottom-nav" aria-label="Mobile navigation">${navigationLinks(current)}</nav>`;
export const mobileNavCSS=String.raw`
body>nav.app-bottom-nav{display:none}
@media(max-width:650px){
  body.has-mobile-nav{padding-bottom:calc(58px + env(safe-area-inset-bottom,0px))}
  .member-site .desktop-menu,.member-site .mobile-menu{display:none}
  body>nav.app-bottom-nav{
    box-sizing:border-box;position:fixed;inset:auto 0 0;z-index:100;
    display:grid;grid-template-columns:repeat(5,minmax(0,1fr));align-items:stretch;gap:0;
    width:100%;max-width:none;height:calc(58px + env(safe-area-inset-bottom,0px));
    margin:0;padding:0 env(safe-area-inset-right,0px) env(safe-area-inset-bottom,0px) env(safe-area-inset-left,0px);
    border:0;border-top:1px solid var(--concrete);border-radius:0;
    background:var(--paper);color:var(--ink);box-shadow:0 -4px 16px #00000018;
    transform:none;filter:none;backdrop-filter:none;isolation:isolate;
  }
  body>nav.app-bottom-nav>a{
    box-sizing:border-box;display:flex;align-items:center;justify-content:center;
    min-width:0;min-height:0;height:57px;margin:0;padding:0 2px;
    border:0;border-top:3px solid transparent;border-radius:0;
    color:var(--ink);background:transparent;text-decoration:none;
    font:600 .875rem/1.2 var(--sans);letter-spacing:0;text-transform:none;white-space:nowrap;
  }
  body>nav.app-bottom-nav>a[aria-current=page]{color:var(--brick);border-top-color:var(--brick)}
  body>nav.app-bottom-nav>a:hover{color:var(--brick);background:var(--tint)}
  body>nav.app-bottom-nav>a:focus-visible{outline:2px solid var(--brick);outline-offset:-4px}
}
@media print{body>nav.app-bottom-nav{display:none!important}body.has-mobile-nav{padding-bottom:0!important}}
`;
