// js/nav-loader.js

document.addEventListener("DOMContentLoaded", function() {
    // Highlight the active navigation link based on current URL path
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll("nav a");
    navLinks.forEach(link => {
      if(link.getAttribute("href") === currentPath) {
        link.classList.add("active");
      }
    });
  
    // Toggle dropdown menus when clicking on their parent container
    const dropdowns = document.querySelectorAll(".dropdown");
    dropdowns.forEach(dropdown => {
      dropdown.addEventListener("click", function(e) {
        e.stopPropagation();
        const dropdownContent = this.querySelector(".dropdown-content");
        if (dropdownContent) {
          dropdownContent.classList.toggle("show");
        }
      });
    });
  
    // Close any open dropdowns when clicking outside of them
    document.addEventListener("click", function() {
      document.querySelectorAll(".dropdown-content").forEach(dropdown => {
        dropdown.classList.remove("show");
      });
    });
  });
  