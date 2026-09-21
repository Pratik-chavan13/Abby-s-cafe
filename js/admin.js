// Initialize Supabase Client
const supabaseUrl = 'https://xsipacivhrjdjardaqfn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhzaXBhY2l2aHJqZGphcmRhcWZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5ODQ5MzcsImV4cCI6MjEwNTU2MDkzN30.mtB4ODKlmmVZwdFZVofUqt4Yn0BwJuWDuX9VWKv28aQ';
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

// DOM Elements
const loginSection = document.getElementById('loginSection');
const dashboardSection = document.getElementById('dashboardSection');
const loginForm = document.getElementById('loginForm');
const ordersTableBody = document.getElementById('ordersTableBody');
const notificationSound = document.getElementById('notificationSound');

let realtimeSubscription = null;

// Status colors mapping
const statusColors = {
  'pending': 'bg-red-100 text-red-800 border-red-200',
  'preparing': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'ready': 'bg-green-100 text-green-800 border-green-200',
  'completed': 'bg-gray-100 text-gray-800 border-gray-200',
  'cancelled': 'bg-gray-100 text-gray-500 border-gray-200 line-through'
};

// Check Session on Load
window.addEventListener('DOMContentLoaded', async () => {
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (session) {
    showDashboard();
  } else {
    showLogin();
  }
});

// Handle Login
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('emailInput').value;
  const password = document.getElementById('passwordInput').value;
  
  const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
  
  if (error) {
    alert('Login failed: ' + error.message);
  } else {
    showDashboard();
  }
});

// Handle Logout
async function handleLogout() {
  await supabaseClient.auth.signOut();
  if (realtimeSubscription) {
    supabaseClient.removeChannel(realtimeSubscription);
  }
  showLogin();
}

function showLogin() {
  loginSection.classList.remove('hidden');
  dashboardSection.classList.add('hidden');
}

function showDashboard() {
  loginSection.classList.add('hidden');
  dashboardSection.classList.remove('hidden');
  fetchOrders();
  subscribeToNewOrders();
}

// Fetch Initial Orders
async function fetchOrders() {
  const today = new Date();
  today.setHours(0,0,0,0);

  const { data: orders, error } = await supabaseClient
    .from('orders')
    .select('*')
    .gte('created_at', today.toISOString())
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching orders:', error);
    return;
  }

  renderOrders(orders);
  updateStats(orders);
}

// Render Orders Table
function renderOrders(orders) {
  ordersTableBody.innerHTML = orders.map(order => {
    const time = new Date(order.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    const itemsHtml = order.items.map(item => `${item.quantity}x ${item.name}`).join('<br>');
    const isPending = order.status === 'pending';
    
    return `
      <tr class="hover:bg-surface-container-low/30 transition-colors">
        <td class="p-4 align-top whitespace-nowrap text-secondary">${time}</td>
        <td class="p-4 align-top">
          <div class="font-medium text-primary">${order.customer_name}</div>
          <div class="text-label-sm text-secondary">${order.customer_phone}</div>
        </td>
        <td class="p-4 align-top text-primary">${itemsHtml}</td>
        <td class="p-4 align-top font-medium text-primary">₹${order.total}</td>
        <td class="p-4 align-top">
          <span class="px-2.5 py-1 rounded-full text-label-sm border ${statusColors[order.status]} uppercase tracking-wider">
            ${order.status}
          </span>
        </td>
        <td class="p-4 align-top text-right">
          ${isPending ? `<button onclick="updateOrderStatus('${order.id}', 'preparing')" class="px-4 py-1.5 bg-primary text-white text-label-sm rounded-full hover:bg-espresso transition-colors">Start Prep</button>` : ''}
          ${order.status === 'preparing' ? `<button onclick="updateOrderStatus('${order.id}', 'ready')" class="px-4 py-1.5 bg-olive-accent text-white text-label-sm rounded-full transition-colors">Mark Ready</button>` : ''}
          ${order.status === 'ready' ? `<button onclick="updateOrderStatus('${order.id}', 'completed')" class="px-4 py-1.5 bg-green-600 text-white text-label-sm rounded-full transition-colors">Complete</button>` : ''}
        </td>
      </tr>
    `;
  }).join('');
}

// Update Order Status
async function updateOrderStatus(id, newStatus) {
  const { error } = await supabaseClient
    .from('orders')
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq('id', id);
    
  if (error) {
    alert('Failed to update status');
    console.error(error);
  } else {
    fetchOrders(); // refresh table
  }
}

// Update Dashboard Stats
function updateStats(orders) {
  document.getElementById('statTodayCount').innerText = orders.length;
  document.getElementById('statPendingCount').innerText = orders.filter(o => o.status === 'pending').length;
}

// Realtime Subscription
function subscribeToNewOrders() {
  realtimeSubscription = supabaseClient
    .channel('public:orders')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, payload => {
      console.log('New order received!', payload);
      playNotificationSound();
      fetchOrders(); // Refresh to get latest data
    })
    .subscribe();
}

function playNotificationSound() {
  notificationSound.currentTime = 0;
  notificationSound.play().catch(e => console.log('Audio play prevented by browser:', e));
}
