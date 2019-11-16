"use_strict";

/***
 *      Supermarket scanner application.
 */

document.addEventListener("DOMContentLoaded", function(_e) {
    
    /** User info management */
    if (localStorage.getItem("infos")) {
        let obj = JSON.parse(localStorage.getItem("infos"));
        console.log(obj);
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
        else {
            document.querySelector("#bcStart p").innerHTML = "Allez, un petit effort..."   
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
    document.getElementById("btnInfos").addEventListener("click", function() {
            document.getElementById("bcInfos").style.display = "block";
            document.getElementById("bcMain").style.display = "none";
    });
    
    
    
    /**********************************************************************
     *                          Barcode reader                            *
     *  Taken from: https://github.com/EddieLa/JOB                        *
     **********************************************************************/
    JOB.Init();
    JOB.SetImageCallback(function(result) {
        if (result.length > 0 && result[0].Format == "EAN-13") {
            addProduct(result[0].Value);
        }
        else {
            alert("Impossible d'extraire un code-barre");
        }
    });
    
    var picture = document.createElement("img");
    document.getElementById("btnAjouter").addEventListener("change", function (event) {
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
    
    
    let products = {};
    
    let basket = {
        content: {},
        add: function(p) {
            if (! products[p]) {
                return -1;
            }
            if (! this.content[p]) {
                this.content[p] = { ean: p, quantity: 0, label: products[p].label, price: products[p].price, last: 0 };      
            }
            this.content[p].quantity++;
            this.content[p].last = Date.now();
            return 0;
        },
        display: function() {
            let main = document.querySelector("#bcMain main");
            let header = document.querySelector("#bcMain header");
            let nb = 0, total = 0;
            main.innerHTML = "";
            Object.values(this.content).sort(function(e1, e2) {
                return e2.last - e1.last;   
            }).forEach(function(e) {
                nb += e.quantity;
                total += e.quantity * e.price;
                main.innerHTML += "<div data-ean='" + e.ean + 
                     "' data-quantity='" + e.quantity + 
                     "' data-price='" + e.price + "'>" +
                     e.label + "</div>";
            });
            header.dataset.total = total;
            header.dataset.number = nb;
        },
        remove: function(p) {
            if (! this.content[p]) {
                return -1;
            }
            if (this.content[p].quantity == 1) {
                delete(this.content[p]);   
            }
            else {
                this.content[p].quantity--;
                this.content[p].last = Date.now();
            }
            return 0;
        }
    };
    
    
    function addProduct(ean) {
        let r = basket.add(1*ean);
        if (r == 0) {
            basket.display();
            document.getElementById("bcScan").display = "none";
        }
        else {
            alert("Ce code n'est pas reconnu.");
        }   
    }
    
    function removeProduct(ean) {
        if (basket.content[ean] && basket.content[ean].quantity == 1) {
            if (! confirm("Supprimer le produit sélectionné ?")) {
                return;
            }
        }
        let r = basket.remove(ean);
        if (r < 0) {
            // should not happen
            alert("Produit inconnu");   
        }
        else {
            basket.display();
        }
    }
    
    
    /** Loading product list **/
    /** XMLHttpRequest vs. fetch: fetch comes from ES2015, so old devices may not implement it... */ 
    let xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            readProducts(this.responseText);   
        }
    }
    xhr.open("GET", "produits.csv");
    xhr.send();
    
    function readProducts(content) {
        content.split("\n").forEach(function(line) {
            let l = line.split(";").map(function(el) { return el.trim(); });
            if (l.length == 3) {
                products[l[0]] = { label: l[1], price: l[2] };   
            }
        });
    }
    
});     