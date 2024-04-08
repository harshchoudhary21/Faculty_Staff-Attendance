const sideMenu = document.querySelector("aside");
const menuBtn = document.querySelector(".menu-btn");
const closeBtn = document.querySelector("#close-btn");
const themetoggler = document.querySelector(".theme-toggler");

menuBtn.addEventListener('click', function () {
        sideMenu.style.display = 'block';
    })

closeBtn.addEventListener('click', () => {
    sideMenu.style.display = 'none';
})

themetoggler.addEventListener('click', () => {
    document.body.classList.toggle('dark-theme-variables');

    themetoggler.querySelector('span').classList.toggle('active');
})

function toggleDropdown() {
    document.getElementById("menu-dropdown-content").classList.toggle("show");
}

$(document).ready(function(){
    $(".dropbtn").click(function(){
        $(this).next(".dropdown-content").toggle();
    });

    $(document).click(function(e) {
        var target = e.target;
        if (!$(target).is('.dropbtn') && !$(target).parents().is('.dropdown')) {
            $(".dropdown-content").hide();
        }
    });
});