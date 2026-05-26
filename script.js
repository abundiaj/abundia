const sheetURL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSHLrhQjaxFPEOVWmL1Q7qiE7ddk5RXkgZm-3pDFTtAq2e6oUKs6r7qM2lHUOtTxrXQKBBNX6QKZMD7/pub?output=tsv";

let productos = [];
let carrito = [];
let categoriaActual = "cocina"; 

const productList = document.getElementById("product-list");
const cart = document.getElementById("cart");
const cartItems = document.getElementById("cart-items");
const cartCount = document.getElementById("cart-count");
const cartTotal = document.getElementById("cart-total");
const whatsappBtn = document.getElementById("whatsapp-btn");

async function cargarProductosDesdeSheet() {
  try {
    const res = await fetch(sheetURL);
    const texto = await res.text();
    const filas = texto.split("\n").filter(f => f.trim() !== "");

    productos = filas.slice(1).map(fila => {
      const celdas = fila.split("\t");
      if (celdas.length >= 4) {
        return {
          nombre: celdas[0].trim(),
          precio: parseFloat(celdas[1].replace("$", "").replace(".", "")) || 0,
          imagen: celdas[2].trim(),
          categoria: celdas[3].trim().toLowerCase()
        };
      }
      return null;
    }).filter(p => p !== null);

    renderProductos();
  } catch (error) {
    console.error("Error al cargar datos:", error);
  }
}

function renderProductos() {
  const filtrados = productos.filter(p => p.categoria === categoriaActual.toLowerCase());
  renderLista(filtrados);
}

function renderLista(lista) {
  if (!productList) return;
  productList.innerHTML = "";

  if (lista.length === 0) {
    productList.innerHTML = `<p style="grid-column: 1/-1; text-align:center;">No se encontraron productos.</p>`;
    return;
  }

  lista.forEach(prod => {
    const enCarrito = carrito.find(item => item.nombre === prod.nombre);
    const badge = enCarrito ? `<span class="cantidad-badge">${enCarrito.cantidad}</span>` : "";

    const div = document.createElement("div");
    div.className = "product";
    div.innerHTML = `
      <img src="${prod.imagen}" alt="${prod.nombre}">
      <h3>${prod.nombre}</h3>
      <p><strong>$${prod.precio.toLocaleString('es-AR')}</strong></p>
      <button onclick='agregarAlCarrito(${JSON.stringify(prod)})'>
        Agregar al carrito ${badge}
      </button>
    `;
    productList.appendChild(div);
  });
}

window.agregarAlCarrito = function(prod) {
  const existe = carrito.find(item => item.nombre === prod.nombre);
  if (existe) {
    existe.cantidad++;
  } else {
    carrito.push({ ...prod, cantidad: 1 });
  }
  actualizarCarrito();
  cart.classList.add("visible");
};

function actualizarCarrito() {
  cartItems.innerHTML = "";
  let total = 0;

  carrito.forEach((item, index) => {
    const subtotal = item.precio * item.cantidad;
    total += subtotal;
    const li = document.createElement("li");
    li.innerHTML = `
      <img src="${item.imagen}" style="width:40px; height:40px; object-fit:cover;">
      <div style="flex-grow:1; font-size:0.8rem;">${item.nombre} (x${item.cantidad})</div>
      <button onclick="eliminarDelCarrito(${index})">🗑️</button>
    `;
    cartItems.appendChild(li);
  });

  const totalProductos = carrito.reduce((s, i) => s + i.cantidad, 0);

  // Actualiza el contador dentro del carrito lateral
  if (cartCount) cartCount.textContent = totalProductos;
  
  // Actualiza la burbuja del nuevo botón flotante del Header
  const mainCartBadge = document.getElementById("cart-count-badge");
  if (mainCartBadge) mainCartBadge.textContent = totalProductos;

  if (cartTotal) cartTotal.textContent = total.toLocaleString('es-AR');
  renderProductos();
}

window.eliminarDelCarrito = function(index) {
  if (carrito[index].cantidad > 1) {
    carrito[index].cantidad--;
  } else {
    carrito.splice(index, 1);
  }
  actualizarCarrito();
};

document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.getElementById("product-search");

  // Buscador
  searchInput.addEventListener("input", (e) => {
    const term = e.target.value.toLowerCase();
    const filtrados = productos.filter(p => p.nombre.toLowerCase().includes(term));
    renderLista(filtrados);
  });

  // Categorías
  document.querySelectorAll("#categories li").forEach(li => {
    li.addEventListener("click", () => {
      categoriaActual = li.dataset.category;
      searchInput.value = "";
      window.scrollTo({ top: 0, behavior: 'smooth' });
      renderProductos();
    });
  });

  // Botones Carrito
  document.getElementById("toggle-cart").onclick
