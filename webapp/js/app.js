/***
 *      Supermarket scanner application.
 */

document.addEventListener("DOMContentLoaded", function(_e) {
    
    /** User info management */
    if (localStorage.getItem("infos")) {
        let obj = JSON.parse(localStorage.getItem("infos"));
        document.getElementById("numCarte").value = obj.carte;
        document.getElementById("emailUser").value = obj.email;
    }
    
    /** Touch Events related to the bcStart block **/
    let touchStart = null;
    document.getElementById("bcStart").addEventListener("touchstart", function(e) {
        touchStart = e.changedTouches.item(0).clientX;
    }, { passive: true });
    document.getElementById("bcStart").addEventListener("touchend", function(e) {
        let touchEnd = e.changedTouches.item(0).clientX;
        if (touchStart - touchEnd > window.innerWidth / 2) {
            this.style.display = "none";
            let nextPage = localStorage.getItem("infos") != null ? "bcMain" : "bcInfos";
            document.getElementById(nextPage).style.display = "block";
        }
    }, { passive: true });
    
    
    /** Events related to the bcInfo block **/
    document.getElementById("btnEnregistrer").addEventListener("click", function(e) {
        let error = document.querySelector("#bcInfos :invalid");
        if (error) {
            alert("Erreurs détectées dans les données saisies");
            error.focus();   
        }
        else {
            localStorage.setItem("infos", JSON.stringify({ carte: document.getElementById("numCarte").value, 
                                                           email: document.getElementById("emailUser").value }));
            document.getElementById("bcInfos").style.display = "none";
            document.getElementById("bcMain").style.display = "block";
        }
    });
    
    /** Events related to the bcMain block **/
    document.getElementById("btnAjouter").addEventListener("click", function() {
        document.getElementById("bcScan").style.display = "block"; 
    });
    
    
    JOB.Init();
    JOB.SetImageCallback(function(result) {
        console.log("result: ", result);
        if (result.length > 0 && result[0].Format == "EAN-13") {
            document.getElementById("codeEAN").value = result[0].Value;   
            addProduct();
        }
        else {
            alert("Impossible d'extraire un code-barre");
        }
    });
    
    var picture = document.createElement("img");
    document.getElementById("takePhoto").addEventListener("change", function (event) {
        var files = event.target.files;
        if (files && files.length > 0) {
            var file = files[0];
            try {
                var URL = window.URL || window.webkitURL;
                picture.onload = function(event) {
                    JOB.DecodeImage(picture);
                    URL.revokeObjectURL(file);
                };
                picture.src = URL.createObjectURL(file);
            }
            catch (e) {
                try {
                    var fileReader = new FileReader();
                    fileReader.onload = function (event) {
                        picture.onload = function(event) {
                            JOB.DecodeImage(picture);
                        };
                        picture.src = event.target.result;
                    };
                    fileReader.readAsDataURL(file);
                }
                catch (e) {
                    alert("Impossible d'utiliser cette fonctionnalité");
                }
            }
        }
    });
    
    
    
    
    let basket = {
        content: {},
        add: function(p) {
            if (! content[p]) {
                content[p] = { quantity: 0, label: products[p].label, price: products[p].price, last: 0 };      
            }
            content[p].quantity++;
            content[p].last = Date.now();
            return 0;
        },
        display: function() {
                   
        },
        remove: function(p) {
             
        }
    };
    
    
    function addProduct() {
        let r = basket.add(document.getElementById("codeEAN").value);
        if (r == 0) {
            basket.display();
            document.getElementById("bcScan").display = "none";
        }
        else {
            alert("Ce code n'est pas reconnu.");
        }   
    }
    
    
    let products = {};
//    fetch("./produits.csv").then(function(;
    let xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            readProducts(this.responseText);   
        }
    }
    
    
    function readProducts(content) {
                   
    }
    
});     