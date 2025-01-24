console.log('IT’S ALIVE!');

function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

let nav = document.createElement('nav');
document.body.prepend(nav);

let pages = [
  { url: '', title: 'Home' },
  { url: 'projects/', title: 'Projects' },
  { url: 'contact/', title: "Contact" },
  { url: 'https://github.com/seashello', title: "Profile" },
  { url: 'resume/', title: "Resume" },
];

const ARE_WE_HOME = document.documentElement.classList.contains('home');

for (let p of pages) {
  const ARE_WE_HOME = document.documentElement.classList.contains('home');
  let url = p.url;
  if (!ARE_WE_HOME && !url.startsWith('http')) {
    url = '../' + url;
  }
  let title = p.title;

  let a = document.createElement('a');
  a.href = url;
  a.textContent = title;

  if (a.host === location.host && a.pathname === location.pathname) {
    a.classList.add('current');
  }
  if (a.host !== location.host) {
    a.target = "_blank";
  }

  nav.append(a);
}