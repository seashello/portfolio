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

for (let p of pages) {
  const ARE_WE_HOME = document.documentElement.classList.contains('home');
  let url = p.url;
  if (!ARE_WE_HOME && !url.startsWith('http')) {
    url = '../' + url;
  }
  let title = p.title;
  nav.insertAdjacentHTML('beforeend', `<a href="${url}">${title}</a>`);
}

const ARE_WE_HOME = document.documentElement.classList.contains('home');
