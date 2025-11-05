function activeMenuOption(href) {
    $("#appMenu .nav-link")
    .removeClass("active")
    .removeAttr('aria-current')

    $(`[href="${(href ? href : "#/")}"]`)
    .addClass("active")
    .attr("aria-current", "page")
}
function disableAll() {
    const elements = document.querySelectorAll(".while-waiting")
    elements.forEach(function (el, index) {
        el.setAttribute("disabled", "true")
        el.classList.add("disabled")
    })
}
function enableAll() {
    const elements = document.querySelectorAll(".while-waiting")
    elements.forEach(function (el, index) {
        el.removeAttribute("disabled")
        el.classList.remove("disabled")
    })
}
function debounce(fun, delay) {
    let timer
    return function (...args) {
        clearTimeout(timer)
        timer = setTimeout(function () {
            fun.apply(this, args)
        }, delay)
    }
}


const DateTime = luxon.DateTime
let lxFechaHora
let diffMs = 0
const configFechaHora = {
    locale: "es",
    weekNumbers: true,
    // enableTime: true,
    minuteIncrement: 15,
    altInput: true,
    altFormat: "d/F/Y",
    dateFormat: "Y-m-d",
    // time_24hr: false
}

const app = angular.module("angularjsApp", ["ngRoute"])


app.service("SesionService", function () {
    this.tipo = null
    this.usr = null

    this.setTipo = function (tipo) { this.tipo = tipo }
    this.getTipo = function () { return this.tipo }
    this.setUsr = function (usr) { this.usr = usr }
    this.getUsr = function () { return this.usr }
})

app.factory("CategoriaFactory", function () {
    function Categoria(titulo, productos) {
        this.titulo    = titulo
        this.productos = productos
    }

    Categoria.prototype.getInfo = function () {
        return {
            titulo: this.titulo,
            productos: this.productos
        }
    }

    return {
        create: function (titulo, productos) {
            return new Categoria(titulo, productos)
        }
    }
})
app.service("MensajesService", function () {
    this.modal = modal
    this.pop   = pop
    this.toast = toast
})
app.service("ProductoAPI", function ($q) {
    this.producto = function (id) {
        var deferred = $q.defer()

        $.get(`producto/${id}`)
        .done(function (producto){
            deferred.resolve(producto)
        })
        .fail(function (error) {
            deferred.reject(error)
        })

        return deferred.promise
   }
})
app.service("RecetaAPI", function ($q) {
    this.ingredientesProducto = function (producto) {
        var deferred = $q.defer()

        $.get(`productos/ingredientes/${producto}`)
        .done(function (ingredientes){
            deferred.resolve(ingredientes)
        })
        .fail(function (error) {
            deferred.reject(error)
        })

        return deferred.promise
    }
})
app.factory("RecetaFacade", function(ProductoAPI, RecetaAPI, $q) {
    return {
        obtenerRecetaProducto: function(producto) {
            return $q.all({
                producto: ProductoAPI.producto(producto),
                ingredientes: RecetaAPI.ingredientesProducto(producto)
            })
        }
    };
})

app.config(function ($routeProvider, $locationProvider, $provide) {
    $provide.decorator("MensajesService", function ($delegate, $log) {
        const originalModal = $delegate.modal
        const originalPop   = $delegate.pop
        const originalToast = $delegate.toast

        $delegate.modal = function (msg) {
            originalModal(msg, "Mensaje", [
                {"html": "Aceptar", "class": "btn btn-lg btn-secondary", defaultButton: true, dismiss: true}
            ])
        }
        $delegate.pop = function (msg) {
            $(".div-temporal").remove()
            $("body").prepend($("<div />", {
                class: "div-temporal"
            }))
            originalPop(".div-temporal", msg, "info")
        }
        $delegate.toast = function (msg) {
            originalToast(msg, 2)
        }

        return $delegate
    })

    $locationProvider.hashPrefix("")

    $routeProvider
    .when("/", {
        templateUrl: "login",
        controller: "loginCtrl"
    })
    .when("/playlists", {
        templateUrl: "playlists",
        controller: "playlistsCtrl"
    })
    .otherwise({
        redirectTo: "/"
    })
})
app.run(["$rootScope", "$location", "$timeout", "SesionService", function($rootScope, $location, $timeout, SesionService) {
    $rootScope.slide             = ""
    $rootScope.spinnerGrow       = false
    $rootScope.sendingRequest    = false
    $rootScope.incompleteRequest = false
    $rootScope.completeRequest   = false
    $rootScope.login             = localStorage.getItem("login")
    const defaultRouteAuth       = "#/productos"
    let timesChangesSuccessRoute = 0


    function actualizarFechaHora() {
        lxFechaHora = DateTime.now().plus({
            milliseconds: diffMs
        })

        $rootScope.angularjsHora = lxFechaHora.setLocale("es").toFormat("hh:mm:ss a")
        $timeout(actualizarFechaHora, 500)
    }
    actualizarFechaHora()


    let prefs = localStorage.getItem("preferencias")
    try {
        prefs = (prefs ? JSON.parse(prefs) : {})
    } catch (e) {
        prefs = {}
    }
    $rootScope.preferencias = prefs
    SesionService.setTipo(prefs.tipo_usuario || prefs.tipo)
    SesionService.setUsr(prefs.nombre_usuario || prefs.usr)



    $rootScope.$on("$routeChangeSuccess", function (event, current, previous) {
        $rootScope.spinnerGrow = false
        const path             = current.$$route.originalPath


        // AJAX Setup
        $.ajaxSetup({
            beforeSend: function (xhr) {
                // $rootScope.sendingRequest = true
            },
            headers: {
                Authorization: `Bearer ${localStorage.getItem("JWT")}`
            },
            error: function (error) {
                $rootScope.sendingRequest    = false
                $rootScope.incompleteRequest = false
                $rootScope.completeRequest   = true

                const status = error.status
                enableAll()

                if (status) {
                    const respuesta = error.responseText
                    console.log("error", respuesta)

                    if (status == 401) {
                        cerrarSesion()
                        return
                    }

                    modal(respuesta, "Error", [
                        {html: "Aceptar", class: "btn btn-lg btn-secondary", defaultButton: true, dismiss: true}
                    ])
                }
                else {
                    toast("Error en la petici&oacute;n.")
                    $rootScope.sendingRequest    = false
                    $rootScope.incompleteRequest = true
                    $rootScope.completeRequest   = false
                }
            },
            statusCode: {
                200: function (respuesta) {
                    $rootScope.sendingRequest    = false
                    $rootScope.incompleteRequest = false
                    $rootScope.completeRequest   = true
                },
                401: function (respuesta) {
                    cerrarSesion()
                },
            }
        })

        // solo hacer si se carga una ruta existente que no sea el splash
        if (path.indexOf("splash") == -1) {
            // validar login
            function validarRedireccionamiento() {
                const login = localStorage.getItem("login")

                if (login) {
                    if (path == "/") {
                        window.location = defaultRouteAuth
                        return
                    }

                    $(".btn-cerrar-sesion").click(function (event) {
                        $.post("cerrarSesion")
                        $timeout(function () {
                            cerrarSesion()
                        }, 500)
                    })
                }
                else if ((path != "/")
                    &&  (path.indexOf("emailToken") == -1)
                    &&  (path.indexOf("resetPassToken") == -1)) {
                    window.location = "#/"
                }
            }
            function cerrarSesion() {
                localStorage.removeItem("JWT")
                localStorage.removeItem("login")
                localStorage.removeItem("preferencias")

                const login      = localStorage.getItem("login")
                let preferencias = localStorage.getItem("preferencias")

                try {
                    preferencias = (preferencias ? JSON.parse(preferencias) :  {})
                }
                catch (error) {
                    preferencias = {}
                }

                $rootScope.redireccionar(login, preferencias)
            }
            $rootScope.redireccionar = function (login, preferencias) {
                $rootScope.login        = login
                $rootScope.preferencias = preferencias

                validarRedireccionamiento()
            }
            validarRedireccionamiento()


            // animate.css
            const active = $("#appMenu .nav-link.active").parent().index()
            const click  = $(`[href^="#${path}"]`).parent().index()

            if ((active <= 0)
            ||  (click  <= 0)
            ||  (active == click)) {
                $rootScope.slide = "animate__animated animate__faster animate__bounceIn"
            }
            else if (active != click) {
                $rootScope.slide  = "animate__animated animate__faster animate__slideIn"
                $rootScope.slide += ((active > click) ? "Left" : "Right")
            }


            // swipe
            if (path.indexOf("productos") != -1) {
                $rootScope.leftView      = ""
                $rootScope.rightView     = "Ventas"
                $rootScope.leftViewLink  = ""
                $rootScope.rightViewLink = "#/ventas"
            }
            else if (path.indexOf("ventas") != -1) {
                $rootScope.leftView      = "Productos"
                $rootScope.rightView     = "Notificaciones"
                $rootScope.leftViewLink  = "#/productos"
                $rootScope.rightViewLink = "#/notificaciones"
            }
            else {
                $rootScope.leftView      = ""
                $rootScope.rightView     = ""
                $rootScope.leftViewLink  = ""
                $rootScope.rightViewLink = ""
            }

            let offsetX
            let threshold
            let startX = 0
            let startY = 0
            let currentX = 0
            let isDragging = false
            let isScrolling = false
            let moved = false
            let minDrag = 5

            function resetDrag() {
                offsetX = -window.innerWidth
                threshold = window.innerWidth / 4
                $("#appSwipeWrapper").get(0).style.transition = "transform 0s ease"
                $("#appSwipeWrapper").get(0).style.transform = `translateX(${offsetX}px)`
            }
            function startDrag(event) {
                if (isScrolling && isPartiallyVisible($("#appContent").get(0))) {
                    resetDrag()
                }

                isDragging  = true
                moved       = false
                isScrolling = false

                startX = getX(event)
                startY = getY(event)

                $("#appSwipeWrapper").get(0).style.transition = "none"
                document.body.style.userSelect = "none"
            }
            function onDrag(event) {
                if (!isDragging
                ||  $(event.target).parents("table").length
                ||  $(event.target).parents("button").length
                ||  $(event.target).parents("span").length
                ||   (event.target.nodeName == "BUTTON")
                ||   (event.target.nodeName == "SPAN")
                || $(event.target).parents(".plotly-grafica").length
                || $(event.target).hasClass("plotly-grafica")) {
                    return
                }

                let x = getX(event)
                let y = getY(event)

                let deltaX = x - startX
                let deltaY = y - startY
                
                if (isScrolling) {
                    if (isPartiallyVisible($("#appContent").get(0))) {
                        resetDrag()
                    }
                    return
                }

                if (!moved) {
                    if (Math.abs(deltaY) > Math.abs(deltaX)) {
                        isScrolling = true
                        return
                    }
                }

                if (Math.abs(deltaX) > minDrag) {
                    moved = true
                }

                currentX = offsetX + deltaX
                $("#appSwipeWrapper").get(0).style.transform = `translateX(${currentX}px)`
                $("#appSwipeWrapper").get(0).style.cursor = "grabbing"

                event.preventDefault()
            }
            function isVisible(element) {
                const rect = element.getBoundingClientRect()
                return rect.left >= 0 && rect.right <= window.innerWidth
            }
            function isPartiallyVisible(element) {
                const rect = element.getBoundingClientRect()
                return rect.right > 0 && rect.left < window.innerWidth
            }
            function endDrag() {
                if (!isDragging) {
                    return
                }
                $("#appSwipeWrapper").get(0).style.cursor = "grab"
                isDragging = false
                document.body.style.userSelect = ""
                if (isScrolling) {
                    if (isPartiallyVisible($("#appContent").get(0))) {
                        resetDrag()
                    }
                    return
                }

                if (!moved) {
                    $("#appSwipeWrapper").get(0).style.transition = "transform 0.3s ease"
                    $("#appSwipeWrapper").get(0).style.transform = `translateX(${offsetX}px)`
                    return
                }

                let delta = currentX - offsetX
                let finalX = offsetX

                let href, visible

                if (delta > threshold && offsetX < 0) {
                    finalX = offsetX + window.innerWidth
                    $("#appContentLeft").css("visibility", "visible")
                    $("#appContentRight").css("visibility", "hidden")
                    href = $("#appContentLeft").children("div").eq(0).attr("data-href")
                    visible = isPartiallyVisible($("#appContentLeft").get(0))
                } else if (delta < -threshold && offsetX > -2 * window.innerWidth) {
                    finalX = offsetX - window.innerWidth
                    $("#appContentLeft").css("visibility", "hidden")
                    $("#appContentRight").css("visibility", "visible")
                    href = $("#appContentRight").children("div").eq(0).attr("data-href")
                    visible = isPartiallyVisible($("#appContentRight").get(0))
                }

                if (href && visible) {
                    resetDrag()
                    $timeout(function () {
                        window.location = href
                    }, 100)
                } else if (!href) {
                    resetDrag()
                    return
                }

                $("#appSwipeWrapper").get(0).style.transition = "transform 0.3s ease"
                $("#appSwipeWrapper").get(0).style.transform = `translateX(${finalX}px)`
                offsetX = finalX
            }
            function getX(event) {
                return event.touches ? event.touches[0].clientX : event.clientX
            }
            function getY(event) {
                return event.touches ? event.touches[0].clientY : event.clientY
            }
            function completeScreen() {
                $(".div-to-complete-screen").css("height", 0)
                const altoHtml    = document.documentElement.getBoundingClientRect().height
                const altoVisible = document.documentElement.clientHeight
                $(".div-to-complete-screen").css("height", ((altoHtml < altoVisible)
                ? (altoVisible - altoHtml)
                : 0) + (16 * 4))
            }

            $(document).off("mousedown touchstart mousemove touchmove click", "#appSwipeWrapper")

            $(document).on("mousedown",  "#appSwipeWrapper", startDrag)
            $(document).on("touchstart", "#appSwipeWrapper", startDrag)
            $(document).on("mousemove",  "#appSwipeWrapper", onDrag)
            // $(document).on("touchmove",  "#appSwipeWrapper", onDrag)
            document.querySelector("#appSwipeWrapper").addEventListener("touchmove", onDrag, {
                passive: false
            })
            $(document).on("mouseup",    "#appSwipeWrapper", endDrag)
            $(document).on("mouseleave", "#appSwipeWrapper", endDrag)
            $(document).on("touchend",   "#appSwipeWrapper", endDrag)
            $(document).on("click",      "#appSwipeWrapper", function (event) {
                if (moved) {
                    event.stopImmediatePropagation()
                    event.preventDefault()
                    return false
                }
            })
            $(window).on("resize", function (event) {
                resetDrag()
                completeScreen()
            })

            resetDrag()


            // solo hacer una vez cargada la animación
            $timeout(function () {
                // animate.css
                $rootScope.slide = ""


                // swipe
                completeScreen()


                // solo hacer al cargar la página por primera vez
                if (timesChangesSuccessRoute == 0) {
                    timesChangesSuccessRoute++
                    

                    // JQuery Validate
                    $.extend($.validator.messages, {
                        required: "Llena este campo",
                        number: "Solo números",
                        digits: "Solo números enteros",
                        min: $.validator.format("No valores menores a {0}"),
                        max: $.validator.format("No valores mayores a {0}"),
                        minlength: $.validator.format("Mínimo {0} caracteres"),
                        maxlength: $.validator.format("Máximo {0} caracteres"),
                        rangelength: $.validator.format("Solo {0} caracteres"),
                        equalTo: "El texto de este campo no coincide con el anterior",
                        date: "Ingresa fechas validas",
                        email: "Ingresa un correo electrónico valido"
                    })


                    // gets
                    const startTimeRequest = Date.now()
                    $.get("fechaHora", function (fechaHora) {
                        const endTimeRequest = Date.now()
                        const rtt            = endTimeRequest - startTimeRequest
                        const delay          = rtt / 2

                        const lxFechaHoraServidor = DateTime.fromFormat(fechaHora, "yyyy-MM-dd hh:mm:ss")
                        // const fecha = lxFechaHoraServidor.toFormat("dd/MM/yyyy hh:mm:ss")
                        const lxLocal = luxon.DateTime.fromMillis(endTimeRequest - delay)

                        diffMs = lxFechaHoraServidor.toMillis() - lxLocal.toMillis()
                    })

                    $.get("preferencias", {
                        token: localStorage.getItem("fbt")
                    }, function (respuesta) {
                        if (typeof respuesta != "object") {
                            return
                        }

                        console.log("✅ Respuesta recibida:", respuesta)

                        const login      = "1"
                        let preferencias = respuesta

                        localStorage.setItem("login", login)
                        localStorage.setItem("preferencias", JSON.stringify(preferencias))
                        $rootScope.redireccionar(login, preferencias)
                    })


                    // events
                    $(document).on("click", ".toggle-password", function (event) {
                        const prev = $(this).parent().find("input")

                        if (prev.prop("disabled")) {
                            return
                        }

                        prev.focus()

                        if ("selectionStart" in prev.get(0)){
                            $timeout(function () {
                                prev.get(0).selectionStart = prev.val().length
                                prev.get(0).selectionEnd   = prev.val().length
                            }, 0)
                        }

                        if (prev.attr("type") == "password") {
                            $(this).children().first()
                            .removeClass("bi-eye")
                            .addClass("bi-eye-slash")
                            prev.attr({
                                "type": "text",
                                "autocomplete": "off",
                                "data-autocomplete": prev.attr("autocomplete")
                            })
                            return
                        }

                        $(this).children().first()
                        .addClass("bi-eye")
                        .removeClass("bi-eye-slash")
                        prev.attr({
                            "type": "password",
                            "autocomplete": prev.attr("data-autocomplete")
                        })
                    })
                }
            }, 500)

            activeMenuOption(`#${path}`)
        }
    })
    $rootScope.$on("$routeChangeError", function () {
        $rootScope.spinnerGrow = false
    })
    $rootScope.$on("$routeChangeStart", function (event, next, current) {
        $rootScope.spinnerGrow = true
    })
}])
app.controller("loginCtrl", function ($scope) {
    $("#frmInicioSesion").submit(function (event) {
        event.preventDefault()
        $(".div-inicio-sesion").html('ℹ️ Iniciando sesión...')

        $.post("iniciarSesion", $(this).serialize())
        .done(function (respuesta) {
            if (respuesta.length) {
                localStorage.setItem("login", "1")
                localStorage.setItem("preferencias", JSON.stringify(respuesta[0]))
                $("#frmInicioSesion").get(0).reset()
                location.reload()
                return
            }
            $(".div-inicio-sesion").html('<div class="alert alert-danger">Usuario y/o contraseña incorrecto(s).</div>')
        })
        .fail(function () {
            $(".div-inicio-sesion").html('<div class="alert alert-danger">Error en la petición.</div>')
        })
    })
})

app.controller("playlistsCtrl", function ($scope) {
    $scope.playlists = []

    function cargarPlaylists() {
        $("#playlistsGrid").html(`<div class="text-center w-100 py-5"><div class="spinner-border" role="status"><span class="visually-hidden">Cargando...</span></div></div>`)
        $.get("api/playlists")
        .done(function (data) {
            $scope.$apply(function () { $scope.playlists = data })
            renderPlaylists(data)
        })
        .fail(function (err) {
            if (err.status === 401) {
                $("#playlistsGrid").html(`<div class="text-center w-100 py-4">Debes iniciar sesión para ver las playlists.</div>`)
                return
            }
            $("#playlistsGrid").html(`<div class="text-center w-100 py-4">Error al obtener playlists.</div>`)
        })
    }

    function renderPlaylists(playlists) {
        if (!playlists || playlists.length === 0) {
            $("#playlistsGrid").html(`<div class="text-center w-100 py-4">No se encontraron playlists.</div>`)
            return
        }
        let html = ""
        for (let i = 0; i < playlists.length; i++) {
            const p = playlists[i]
            html += `<div class="col-12 col-sm-6 col-md-4 col-lg-3 mb-3">
                <div class="card h-100">
                    ${ p.imagen ? `<img src="${p.imagen}" class="card-img-top" style="object-fit:cover;height:160px;">` : `<div style="height:160px;background:#f0f0f0;display:flex;align-items:center;justify-content:center">Sin imagen</div>` }
                    <div class="card-body d-flex flex-column">
                        <h5 class="card-title">${escapeHtml(p.nombre)}</h5>
                        <p class="card-text text-truncate" style="flex:1 1 auto;">${escapeHtml(p.descripcion || '')}</p>
                        ${ p.url ? `<a href="${p.url}" target="_blank" class="btn btn-sm btn-primary mt-2">Abrir</a>` : '' }
                    </div>
                </div>
            </div>`
        }
        $("#playlistsGrid").html(`<div class="row">${html}</div>`)
    }

    function escapeHtml(text) {
        if (!text) return ''
        return String(text)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;')
    }

    cargarPlaylists()
})

document.addEventListener("DOMContentLoaded", function (event) {
    activeMenuOption(location.hash)
})