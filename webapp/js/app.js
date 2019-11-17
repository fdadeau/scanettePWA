"use strict";

//const TRANMISSION_URL = "http://dept-info.univ-fcomte.fr/licence/SAMP/";
const TRANMISSION_URL = "http://localhost/~fred/SAMP/";


/************************************************************************
 *                                                                      *
 *         Supermarket scanner Progressive Web Application              *
 *                                                                      *
 ************************************************************************/
document.addEventListener("DOMContentLoaded", function(_e) {
    
    /** User information management: card number & email address */    
    let userinfo = {
        save: function() {
            localStorage.setItem("infos", JSON.stringify({ carte: document.getElementById("userCard").value,
                                                           email: document.getElementById("userEmail").value,
                                                           nom: document.getElementById("userLastname").value,
                                                           prenom: document.getElementById("userFirstname").value }));
        },
        load: function() {
            let obj = JSON.parse(localStorage.getItem("infos"));
            if (obj) {
                document.getElementById("userCard").value = obj.carte;
                document.getElementById("userEmail").value = obj.email;
                document.getElementById("userLastname").value = obj.nom;
                document.getElementById("userFirstname").value = obj.prenom;
            }
        }
    }
    // loading at startup
    userinfo.load();
    
    
    /** Touch Events related to the bcStart block **/
    let touchStart = null;
    document.getElementById("bcStart").addEventListener("touchstart", function(e) {
        touchStart = e.changedTouches.item(0).clientX;
    }, { passive: true });
    document.getElementById("bcStart").addEventListener("touchend", function(e) {
        let touchEnd = e.changedTouches.item(0).clientX;
        if (touchStart - touchEnd > window.innerWidth / 2) {
            this.style.display = "none";
        }
        else {
            document.querySelector("#bcStart p").innerHTML = 
                (Math.random() < 0.33) ? "Allez, un petit effort..." : 
                (Math.random() < 0.5) ? "Tu peux pas faire mieux que ça ?" : 
                    "T'as pas de force dans les doigts ?";
        }
    }, { passive: true });
    
    
    /** Events related to the bcParams block inputs --> auto-save when focus is lost **/
    let inputs = document.querySelectorAll("#bcParams input[id]");
    for (let i=0; i < inputs.length; i++) {
        inputs.item(i).addEventListener("blur", function(e) {
            let error = document.querySelector("#" + this.id + ":invalid");
            if (! error) {
                userinfo.save();
            }
        });
    }
    
    
    /** Events related to the bcBasket block --> open a popup to adjust quantities **/
    document.getElementById("bcBasket").addEventListener("click", function(e) {
        if (e.target.dataset.quantity) {
            let popup = document.getElementById("bcPopup");
            popup.dataset.ean = e.target.dataset.ean;
            popup.style.display = "block";
            document.getElementById("numQuantity").value = e.target.dataset.quantity;
        }
        else if (e.target.id == "btnClearBasket") {
            if (confirm("Effacer le contenu du panier ?")) {
                basket.clear();
                basket.display();
            }
        }
    });
    
    /** Events related to the bcPopup block **/
    document.getElementById("bcPopup").addEventListener("click", function(e) {
        switch (e.target.id) {
            case 'btnPlus':     // --> add one instance of the product to the basket
                addProduct(this.dataset.ean);
                document.getElementById("numQuantity").value = basket.content[this.dataset.ean].quantity;
            break;    
            case 'btnMinus':    // --> remove one instance of the product
                removeProduct(this.dataset.ean);
                if (! basket.content[this.dataset.ean]) {
                    this.style.display = "none";
                }
                else {
                    document.getElementById("numQuantity").value = basket.content[this.dataset.ean].quantity;
                }
            break;    
            case 'bcPopup':     // --> close when click on background
                this.style.display = "none";
            break;
        }
    });
    
        
    /** Event related to the send button **/
    document.getElementById("btnSend").addEventListener("click", function(e) {
      
        let bcSend = document.getElementById("bcSend");
        
        if (Object.keys(basket.content).length == 0) {
            bcSend.innerHTML = "<p>Impossible de transmettre un panier vide.</p>";
        }
        else if (document.querySelector("#bcParams input:invalid")) {
            bcSend.innerHTML = "<p>Les paramètres de votre compte sont incorrects.</p><p>Allez à la section \"Réglages\" pour les mettre à jour, et recommencez.</p>";
        }
        else {
            bcSend.innerHTML = "<p>Voulez-vous transmettre vos achats ?</p><button id='btnTransmit'>Transmettre</button>";   
        }
        document.getElementById("radSend").checked = true;
    });
                                                        
    document.getElementById("bcSend").addEventListener("click", function(e) {
        let bcSend = document.getElementById("bcSend");
        if (e.target.id == "btnTransmit") {
            bcSend.innerHTML = "<p>Transmission en cours...</p>";
            let xhttp = new XMLHttpRequest();
            xhttp.onreadystatechange = function() {
                if (this.readyState == 4) {
                    if (this.status == 200) {
                        let answer = JSON.parse(this.responseText);
                        if (answer.status === 'ok') {
                            bcSend.innerHTML = "<p>Transmission des achats réalisée avec succès.</p>";
                            basket.clear();
                            basket.display();
                        }
                        else {
                            bcSend.innerHTML = "<p>Echec de la transmission des achats.</p><button id='btnTransmit'>Recommencer</button>";
                        }
                    }
                    else {
                        bcSend.innerHTML = "<p>Connexion impossible au serveur.</p><p>Vérifiez votre connexion internet et réessayez.</p>";
                    }
                }
            };
            xhttp.open("POST",TRANMISSION_URL);
            xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
            let params = Object.values(basket.content).map(function(e) { return "EAN_" + e.ean + "=" + e.quantity; }).join("&");
            xhttp.send(params + "&client=" + document.getElementById("userCard").value);
        }    
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
            alert("Echec de reconnaissance du code-barre");
        }
    });
    // invisible picture used to store the picture taken by the camera
    var picture = document.createElement("img");
    document.getElementById("btnScan").addEventListener("change", function (event) {
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
    
    /**
     *  Current basket
     */
    let basket = {
        content: {},
        add: function(p) {
            if (! products[p]) {
                products[p] = { label: "Article inconnu (" + p + ")", price: 0 };
            }
            if (! this.content[p]) {
                this.content[p] = { ean: p, quantity: 0, label: products[p].label, price: products[p].price, last: 0 };      
            }
            this.content[p].quantity++;
            this.content[p].last = Date.now();
            this.save();
            return 0;
        },
        display: function() {
            let bcBasket = document.querySelector("#bcMain #bcBasket");
            let nb = 0, total = 0;
            bcBasket.innerHTML = "";
            Object.values(this.content).sort(function(e1, e2) {
                return e2.last - e1.last;   
            }).forEach(function(e) {
                nb += e.quantity;
                total += e.quantity * e.price;
                bcBasket.innerHTML += "<div data-ean='" + e.ean + 
                     "' data-quantity='" + e.quantity + 
                     "' data-price='" + e.price + "'>" +
                     e.label + "</div>";
            });
            if (nb > 0) {
                bcBasket.innerHTML += "<button id='btnClearBasket'>Vider le panier</button>";
            }
            bcBasket.dataset.total = total.toFixed(2);
            bcBasket.dataset.number = nb;
            document.querySelector("#bcMain nav #btnBasket").dataset.number = nb;
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
            this.save();
            return 0;
        }, 
        clear: function() {
            this.content = {};
            this.save();
        },
        save: function() {
            localStorage.setItem("basket", JSON.stringify(this.content));   
        },
        load: function() {
            let c = localStorage.getItem("basket");
            if (c) {
                this.content = JSON.parse(c);
                this.display();
            }
        }
    };
    basket.load();
    
    
    function addProduct(ean) {
        let r = basket.add(1*ean);
        if (r == 0) {
            basket.display();
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
    
    

    /********************************************************************************
     *                          Products database                                   *
     ********************************************************************************/
    
    // The set of known products (read from produits.csv)
    let products = {};
    
    // Loading product list 
    let xhr = new XMLHttpRequest();     // better than fetch(...) for compatibility with old devices
    xhr.onreadystatechange = function() {
        if (this.readyState == 4) {
            if (this.status == 200) {
                this.responseText.split("\n").forEach(function(line) {
                    let l = line.split(";").map(function(el) { return el.trim(); });
                    if (l.length == 3) {
                        products[l[0]] = { label: l[1], price: l[2] };   
                    }
                });
            }
            else {
                alert("Impossible d'initialiser la base des produits.");   
            }
        }
    };
    xhr.open("GET", "produits.csv");
    xhr.send();
    
    
    
    // Solves the 100vh bug on iOS (on iOS: 100vh includes the address bar height) 
    window.onresize = function() {
        document.body.height = window.innerHeight;
    }
    window.onresize(); // called to initially set the height.
    
    
    
});     