/**
 * NodeDoc Renderer: Client-side script to fetch and render .ndoc files based on routes.
 */

const currentPath = window.location.pathname === '/' ? '/index' : window.location.pathname;
fetch(`${currentPath}.ndoc`)
  .then(response => {
    if (!response.ok) throw new Error('Page not found');
    return response.text();
  })
  .then(data => render(data))
  .catch(err => {
    document.getElementById('content').innerHTML = '<h1>404</h1><p>Page not found</p>';
    console.error(err);
  });

function render(data) {
  const lines = data.split('\n').map(line => line.trim());
  let moduleName = '';
  let moduleDesc = '';
  const functions = [];
  let currentFunction = null;

  lines.forEach(line => {
    if (!line) return;
    if (line.startsWith('[module:')) {
      moduleName = line.slice(8, -1).trim();
      moduleDesc = lines[lines.indexOf(line) + 1]?.slice(5).trim() || '';
    } else if (line.startsWith('[function:')) {
      currentFunction = { name: line.slice(10, -1).trim(), desc: '', params: [], return: { type: '', desc: '' } };
      functions.push(currentFunction);
    } else if (currentFunction) {
      if (line.startsWith('desc:')) {
        currentFunction.desc = line.slice(5).trim();
      } else if (line.startsWith('param:')) {
        const match = line.slice(6).match(/(\w+)\s*\((\w+)\)\s*-\s*(.+)/);
        if (match) {
          currentFunction.params.push({ name: match[1], type: match[2], desc: match[3] });
        }
      } else if (line.startsWith('return:')) {
        const match = line.slice(7).match(/(\w+)\s*-\s*(.+)/);
        if (match) {
          currentFunction.return = { type: match[1], desc: match[2] };
        }
      }
    }
  });

  const sidebar = document.getElementById('sidebar');
  sidebar.innerHTML = `
    <h3>${moduleName}</h3>
    <ul>
      <li><a href="/" data-section="overview">Home</a></li>
      <li><a href="#" data-section="functions">Functions</a></li>
    </ul>
  `;

  const content = document.getElementById('content');
  content.innerHTML = `
    <section id="overview">
      <h1>${moduleName}</h1>
      <p>${moduleDesc}</p>
    </section>
    <section id="functions" style="display: none;">
      <h2>Functions</h2>
      ${functions.map(func => `
        <article class="function">
          <h3>${func.name}</h3>
          <p>${func.desc}</p>
          <h4>Parameters:</h4>
          <ul>
            ${func.params.map(param => `<li><strong>${param.name}</strong> (${param.type}): ${param.desc}</li>`).join('')}
          </ul>
          <h4>Returns:</h4>
          <p><strong>${func.return.type}</strong>: ${func.return.desc}</p>
        </article>
      `).join('')}
    </section>
  `;

  sidebar.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      if (link.href === window.location.origin + '/') {
        window.history.pushState({}, '', '/');
        fetch('/index.ndoc').then(res => res.text()).then(render);
      } else {
        const section = e.target.dataset.section;
        content.querySelectorAll('section').forEach(s => {
          s.style.display = s.id === section ? 'block' : 'none';
        });
      }
    });
  });

  document.getElementById('search').addEventListener('input', e => {
    const query = e.target.value.toLowerCase();
    document.querySelectorAll('.function').forEach(func => {
      const name = func.querySelector('h3').textContent.toLowerCase();
      func.style.display = name.includes(query) ? 'block' : 'none';
    });
  });

  const ws = new WebSocket('ws://' + location.host);
  ws.onmessage = event => {
    if (event.data === 'reload') location.reload();
  };
}