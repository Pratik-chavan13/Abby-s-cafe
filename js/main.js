// ==========================================
//           AUTHENTICATION SYSTEM
// ==========================================

const supabaseUrl = 'https://xsipacivhrjdjardaqfn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhzaXBhY2l2aHJqZGphcmRhcWZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5ODQ5MzcsImV4cCI6MjEwNTU2MDkzN30.mtB4ODKlmmVZwdFZVofUqt4Yn0BwJuWDuX9VWKv28aQ';
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

let currentUser = null;

// ---- Navigation System ----
let currentPage = 'home';

function navigateTo(page) {
  if (currentPage === page) return;
  
  // Hide all pages
  document.querySelectorAll('.page-section').forEach(el => {
    el.classList.remove('active', 'page-fade-in');
  });
  
  // Show target page
  const target = document.getElementById('page-' + page);
  if (target) {
    target.classList.add('active', 'page-fade-in');
  }
  
  // Update nav active state
  updateNavActiveState(page);
  
  currentPage = page;
  
  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
  
  // Update URL hash
  history.pushState(null, '', '#' + page);
}

function updateNavActiveState(page) {
  // Desktop nav
  document.querySelectorAll('#desktopNav .nav-link').forEach(link => {
    if (link.getAttribute('data-page') === page) {
      link.className = 'nav-link transition-all cursor-pointer bg-white text-primary font-medium rounded-full px-4 py-1.5 shadow-md';
    } else {
      link.className = 'nav-link transition-all cursor-pointer text-white/80 hover:text-white px-4 py-1.5 rounded-full text-body-md';
    }
  });
  
  // Mobile nav
  document.querySelectorAll('.mobile-nav-link').forEach(link => {
    if (link.getAttribute('data-page') === page) {
      link.classList.add('active-mobile');
    } else {
      link.classList.remove('active-mobile');
    }
  });
}

// ---- Mobile Menu ----
function toggleMobileMenu() {
  document.getElementById('mobileOverlay').classList.toggle('open');
  document.getElementById('mobilePanel').classList.toggle('open');
}

// ---- Menu Category Scroll ----
function scrollToMenuSection(sectionId, clickedLink) {
  event.preventDefault();
  const section = document.getElementById(sectionId);
  if (section) {
    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  // Update active cat link
  document.querySelectorAll('.menu-cat-link').forEach(link => {
    link.className = 'menu-cat-link px-space-md py-space-sm rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface text-label-md whitespace-nowrap transition-all hover:scale-105';
  });
  if (clickedLink) {
    clickedLink.className = 'menu-cat-link px-space-md py-space-sm rounded-full bg-primary-container text-on-primary-container text-label-md whitespace-nowrap transition-all hover:scale-105';
  }
}

// ---- Order Modal ----
let currentQty = 1;
let currentItem = '';
let currentPrice = '';

function openOrderModal(name, price) {
  currentItem = name;
  currentPrice = price;
  currentQty = 1;
  document.getElementById('modalItemName').innerText = name;
  document.getElementById('modalItemPrice').innerText = price;
  document.getElementById('modalQty').innerText = currentQty;
  
  const modal = document.getElementById('orderModal');
  const content = document.getElementById('modalContent');
  modal.classList.remove('opacity-0', 'pointer-events-none');
  content.classList.remove('scale-95');
  content.classList.add('scale-100');
}

function closeOrderModal() {
  const modal = document.getElementById('orderModal');
  const content = document.getElementById('modalContent');
  modal.classList.add('opacity-0', 'pointer-events-none');
  content.classList.remove('scale-100');
  content.classList.add('scale-95');
}

function adjustQty(change) {
  currentQty += change;
  if (currentQty < 1) currentQty = 1;
  document.getElementById('modalQty').innerText = currentQty;
}

function confirmOrder() {
  const name = document.getElementById('nameInput').value.trim();
  const phone = document.getElementById('phoneInput').value.trim();
  const notes = document.getElementById('notesInput').value.trim();

  if (!name || !phone) {
    alert('Please enter your name and phone number.');
    return;
  }

  // Calculate total
  const priceNum = parseInt(currentPrice.replace(/[^0-9]/g, ''));
  const total = priceNum * currentQty;

  const orderData = {
    customer_name: name,
    customer_phone: phone,
    customer_email: currentUser ? currentUser.email : null,
    items: [{
      name: currentItem,
      price: priceNum,
      quantity: currentQty
    }],
    total: total,
    notes: notes,
    status: 'pending'
  };

  supabaseClient.from('orders').insert([orderData])
  .then(({ error }) => {
    if (error) throw error;
    alert('Order placed successfully! We will prepare it shortly.');
    closeOrderModal();
    // clear inputs
    document.getElementById('nameInput').value = currentUser ? currentUser.user_metadata?.full_name || '' : '';
    document.getElementById('phoneInput').value = '';
    document.getElementById('notesInput').value = '';
  })
  .catch(err => {
    alert('Failed to place order. Please try again.');
    console.error(err);
  });
}

// ---- Fetch Menu Data from Supabase ----
async function fetchMenu() {
  try {
    const { data: categories, error: catError } = await supabaseClient.from('categories').select('*').order('sort_order', { ascending: true });
    const { data: items, error: itemError } = await supabaseClient.from('menu_items').select('*').eq('is_available', true);
    
    if (catError) throw catError;
    if (itemError) throw itemError;

    // Group items by category
    const categoriesWithItems = categories.map(cat => ({
      ...cat,
      items: items.filter(item => item.category_id === cat.id)
    }));

    
    const container = document.getElementById('menu-container');
    container.innerHTML = ''; // clear loading spinner
    
    categoriesWithItems.forEach(category => {
      // Only render category if it has items
      if (!category.items || category.items.length === 0) return;
      
      let itemsHtml = category.items.map((item, index) => `
        <div data-aos="fade-up" data-aos-delay="${index * 100}" class="bg-surface-container-low rounded-xl p-space-lg shadow-sm flex flex-col justify-between transition-transform duration-300 hover:-translate-y-1">
          <div>
            <div class="relative h-48 rounded-lg overflow-hidden mb-space-md bg-surface-container-high">
              <div class="bg-cover bg-center w-full h-full" style="background-image: url('${item.image_url}')"></div>
              ${item.badge ? `<span class="absolute top-2 right-2 bg-olive-accent text-on-tertiary text-label-sm px-2.5 py-1 rounded-full">${item.badge}</span>` : ''}
            </div>
            <div class="flex justify-between items-start mb-space-xs">
              <h3 class="text-headline-sm font-headline-sm text-primary">${item.name}</h3>
              <span class="text-headline-sm font-headline-sm text-primary font-semibold">₹${item.price}</span>
            </div>
            <p class="text-body-md text-on-surface-variant mb-space-md">${item.description || ''}</p>
          </div>
          <div class="flex items-center justify-between pt-space-md border-t border-outline-variant/20">
            ${item.tag ? `<span class="text-body-sm text-secondary bg-secondary-container/40 px-2.5 py-1 rounded-full">${item.tag}</span>` : '<div></div>'}
            <button class="bg-primary text-on-primary hover:bg-espresso px-space-md py-2 rounded-full text-label-md transition-colors flex items-center gap-space-xs" onclick="openOrderModal('${item.name.replace(/'/g, "\\'")}', '₹${item.price}')">
              <span class="material-symbols-outlined text-[16px]">add_shopping_cart</span> Order Online
            </button>
          </div>
        </div>
      `).join('');

      // Layout tweaks based on category
      const gridClass = category.slug === 'burgers' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';

      const sectionHtml = `
        <section class="scroll-mt-32" id="${category.slug}">
          <div class="flex items-end justify-between mb-space-lg">
            <div>
              <span class="text-label-sm uppercase tracking-wider text-secondary">${category.label || ''}</span>
              <h2 class="text-headline-lg font-headline-lg text-primary">${category.name}</h2>
            </div>
            <p class="text-body-sm text-on-surface-variant hidden md:block">${category.description || ''}</p>
          </div>
          <div class="grid ${gridClass} gap-space-lg">
            ${itemsHtml}
          </div>
        </section>
      `;
      
      container.innerHTML += sectionHtml;
    });
  } catch (err) {
    console.error('Error fetching menu:', err);
    document.getElementById('menu-container').innerHTML = '<p class="text-center text-error">Failed to load menu. Please try again later.</p>';
  }
}

// ---- Handle URL Hash on Load ----
window.addEventListener('DOMContentLoaded', () => {
  // Add AOS attributes to static sections automatically
  document.querySelectorAll('section > div > div, .page-section > section > div').forEach((el, index) => {
    if (!el.hasAttribute('data-aos') && !el.classList.contains('absolute')) {
      el.setAttribute('data-aos', 'fade-up');
      el.setAttribute('data-aos-duration', '800');
    }
  });

  AOS.init({
    once: true,
    offset: 50,
    duration: 800,
  });

  fetchMenu(); // Load dynamic menu
  checkSession(); // Check user auth status

  const hash = window.location.hash.replace('#', '');
  const validPages = ['home', 'our-menu', 'about', 'contact-and-location'];
  if (hash && validPages.includes(hash)) {
    navigateTo(hash);
  } else {
    updateNavActiveState('home');
  }
});

// Handle browser back/forward
window.addEventListener('popstate', () => {
  const hash = window.location.hash.replace('#', '') || 'home';
  const validPages = ['home', 'our-menu', 'about', 'contact-and-location'];
  if (validPages.includes(hash)) {
    navigateTo(hash);
  }
});

async function checkSession() {
  const { data: { session } } = await supabaseClient.auth.getSession();
  updateAuthUI(session?.user || null);
  
  // Listen for auth changes
  supabaseClient.auth.onAuthStateChange((event, session) => {
    updateAuthUI(session?.user || null);
  });
}

function updateAuthUI(user) {
  currentUser = user;
  
  const authBtn = document.getElementById('authBtn');
  const userMenuBtn = document.getElementById('userMenuBtn');
  const navUserName = document.getElementById('navUserName');
  
  const mobileAuthBtn = document.getElementById('mobileAuthBtn');
  const mobileLogoutBtn = document.getElementById('mobileLogoutBtn');

  if (user) {
    // Desktop Nav
    if(authBtn) authBtn.classList.add('hidden');
    if(authBtn) authBtn.classList.remove('md:flex');
    if(userMenuBtn) userMenuBtn.classList.remove('hidden');
    if(userMenuBtn) userMenuBtn.classList.add('flex');
    if(navUserName) navUserName.innerText = user.user_metadata?.full_name?.split(' ')[0] || 'User';
    
    // Dropdown info
    const dropdownName = document.getElementById('dropdownUserName');
    const dropdownEmail = document.getElementById('dropdownUserEmail');
    if(dropdownName) dropdownName.innerText = user.user_metadata?.full_name || 'User';
    if(dropdownEmail) dropdownEmail.innerText = user.email || '';
    
    // Mobile Nav
    if(mobileAuthBtn) mobileAuthBtn.classList.add('hidden');
    if(mobileAuthBtn) mobileAuthBtn.classList.remove('flex');
    if(mobileLogoutBtn) mobileLogoutBtn.classList.remove('hidden');
    if(mobileLogoutBtn) mobileLogoutBtn.classList.add('flex');

    // Auto-fill order modal
    const nameInput = document.getElementById('nameInput');
    if(nameInput && !nameInput.value) nameInput.value = user.user_metadata?.full_name || '';
  } else {
    // Desktop Nav
    if(authBtn) authBtn.classList.remove('hidden');
    if(authBtn) authBtn.classList.add('md:flex');
    if(userMenuBtn) userMenuBtn.classList.add('hidden');
    if(userMenuBtn) userMenuBtn.classList.remove('flex');
    
    // Mobile Nav
    if(mobileAuthBtn) mobileAuthBtn.classList.remove('hidden');
    if(mobileAuthBtn) mobileAuthBtn.classList.add('flex');
    if(mobileLogoutBtn) mobileLogoutBtn.classList.add('hidden');
    if(mobileLogoutBtn) mobileLogoutBtn.classList.remove('flex');
  }
}

// User Menu Dropdown Toggle
function toggleUserMenu() {
  const dropdown = document.getElementById('userMenuDropdown');
  if (dropdown.classList.contains('hidden')) {
    dropdown.classList.remove('hidden');
    dropdown.classList.add('flex');
  } else {
    dropdown.classList.add('hidden');
    dropdown.classList.remove('flex');
  }
}

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
  const btn = document.getElementById('userMenuBtn');
  if (btn && !btn.contains(e.target)) {
    const dropdown = document.getElementById('userMenuDropdown');
    if (dropdown && !dropdown.classList.contains('hidden')) {
      dropdown.classList.add('hidden');
      dropdown.classList.remove('flex');
    }
  }
});

// Modals
function openAuthModal(view = 'login') {
  switchAuthView(view);
  const modal = document.getElementById('authModal');
  const content = document.getElementById('authModalContent');
  modal.classList.remove('opacity-0', 'pointer-events-none');
  content.classList.remove('scale-95');
  content.classList.add('scale-100');
}

function closeAuthModal() {
  const modal = document.getElementById('authModal');
  const content = document.getElementById('authModalContent');
  modal.classList.add('opacity-0', 'pointer-events-none');
  content.classList.remove('scale-100');
  content.classList.add('scale-95');
}

function switchAuthView(view) {
  const loginForm = document.getElementById('loginFormContainer');
  const signupForm = document.getElementById('signupFormContainer');
  const successView = document.getElementById('signupSuccessContainer');
  
  if (view === 'login') {
    loginForm.classList.remove('hidden');
    signupForm.classList.add('hidden');
    if(successView) successView.classList.add('hidden');
    if(successView) successView.classList.remove('flex');
  } else if (view === 'signup') {
    loginForm.classList.add('hidden');
    signupForm.classList.remove('hidden');
    if(successView) successView.classList.add('hidden');
    if(successView) successView.classList.remove('flex');
  } else if (view === 'success') {
    loginForm.classList.add('hidden');
    signupForm.classList.add('hidden');
    if(successView) successView.classList.remove('hidden');
    if(successView) successView.classList.add('flex');
  }
}

// Auth Actions
async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  const btn = e.target.querySelector('button[type="submit"]');
  btn.disabled = true;
  btn.innerText = 'Signing in...';

  const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
  
  btn.disabled = false;
  btn.innerText = 'Sign In';

  if (error) {
    alert(error.message);
  } else {
    closeAuthModal();
    e.target.reset();
  }
}

async function handleSignUp(e) {
  e.preventDefault();
  const name = document.getElementById('signupName').value;
  const email = document.getElementById('signupEmail').value;
  const password = document.getElementById('signupPassword').value;
  const btn = e.target.querySelector('button[type="submit"]');
  btn.disabled = true;
  btn.innerText = 'Creating account...';

  const { error } = await supabaseClient.auth.signUp({
    email, password, options: { data: { full_name: name } }
  });
  
  btn.disabled = false;
  btn.innerText = 'Create Account';

  if (error) {
    alert(error.message);
  } else {
    switchAuthView('success');
    e.target.reset();
  }
}

async function handleLogout() {
  const { error } = await supabaseClient.auth.signOut();
  if (error) alert('Error signing out: ' + error.message);
}

// ==========================================
//          MY ORDERS & SWITCH ACCOUNT
// ==========================================

async function openMyOrders() {
  // Close the dropdown
  const dropdown = document.getElementById('userMenuDropdown');
  if (dropdown) { dropdown.classList.add('hidden'); dropdown.classList.remove('flex'); }

  // Open modal
  const modal = document.getElementById('ordersModal');
  const content = document.getElementById('ordersModalContent');
  modal.classList.remove('opacity-0', 'pointer-events-none');
  content.classList.remove('scale-95');
  content.classList.add('scale-100');

  // Show loading
  const container = document.getElementById('ordersListContainer');
  container.innerHTML = `
    <div class="flex flex-col items-center justify-center py-8 text-center">
      <span class="material-symbols-outlined text-outline text-[48px] mb-4 animate-spin">progress_activity</span>
      <p class="text-body-md text-on-surface-variant">Loading your orders...</p>
    </div>
  `;

  // Fetch orders for this user
  if (!currentUser) return;
  const { data: orders, error } = await supabaseClient
    .from('orders')
    .select('*')
    .eq('customer_email', currentUser.email)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    container.innerHTML = `
      <div class="flex flex-col items-center justify-center py-8 text-center">
        <span class="material-symbols-outlined text-error text-[48px] mb-4">error</span>
        <p class="text-body-md text-on-surface-variant">Could not load orders.</p>
      </div>
    `;
    return;
  }

  if (!orders || orders.length === 0) {
    container.innerHTML = `
      <div class="flex flex-col items-center justify-center py-8 text-center">
        <span class="material-symbols-outlined text-outline text-[48px] mb-4">shopping_bag</span>
        <p class="text-headline-sm font-headline-sm text-primary mb-2">No orders yet</p>
        <p class="text-body-md text-on-surface-variant">Your order history will appear here once you place your first order!</p>
      </div>
    `;
    return;
  }

  // Render orders
  const statusBadge = (status) => {
    const map = {
      pending: 'bg-amber-100 text-amber-800 border-amber-200',
      preparing: 'bg-blue-100 text-blue-800 border-blue-200',
      ready: 'bg-green-100 text-green-800 border-green-200',
      completed: 'bg-gray-100 text-gray-600 border-gray-200',
      cancelled: 'bg-red-100 text-red-600 border-red-200',
    };
    return map[status] || 'bg-gray-100 text-gray-600 border-gray-200';
  };

  container.innerHTML = orders.map(order => {
    const date = new Date(order.created_at);
    const dateStr = date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    const timeStr = date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    const items = order.items?.map(i => `${i.quantity}x ${i.name}`).join(', ') || 'N/A';
    return `
      <div class="border border-outline-variant/20 rounded-xl p-4 mb-3 hover:border-primary/30 transition-colors">
        <div class="flex justify-between items-start mb-2">
          <div>
            <p class="text-label-md text-primary font-medium">${dateStr} · ${timeStr}</p>
            <p class="text-body-sm text-on-surface-variant mt-1">${items}</p>
          </div>
          <span class="px-2.5 py-1 rounded-full text-label-sm border ${statusBadge(order.status)} uppercase tracking-wider shrink-0 ml-3">${order.status}</span>
        </div>
        <div class="flex justify-between items-center pt-2 border-t border-outline-variant/10 mt-2">
          <span class="text-body-sm text-secondary">Total</span>
          <span class="text-headline-sm font-headline-sm text-primary">₹${order.total}</span>
        </div>
      </div>
    `;
  }).join('');
}

function closeMyOrders() {
  const modal = document.getElementById('ordersModal');
  const content = document.getElementById('ordersModalContent');
  modal.classList.add('opacity-0', 'pointer-events-none');
  content.classList.remove('scale-100');
  content.classList.add('scale-95');
}

function switchAccount() {
  // Close dropdown
  const dropdown = document.getElementById('userMenuDropdown');
  if (dropdown) { dropdown.classList.add('hidden'); dropdown.classList.remove('flex'); }

  // Sign out first, then open login modal
  supabaseClient.auth.signOut().then(() => {
    openAuthModal('login');
  });
}
