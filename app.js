window.mobileAndTabletCheck = function () {
    let check = false;
    (function (a) { if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4))) check = true; })(navigator.userAgent || navigator.vendor || window.opera);
    return check;
};

function toLocalISOString(date) {
    const localDate = new Date(date - date.getTimezoneOffset() * 60000); //offset in milliseconds. Credit https://stackoverflow.com/questions/10830357/javascript-toisostring-ignores-timezone-offset

    // Optionally remove second/millisecond if needed
    localDate.setSeconds(null);
    localDate.setMilliseconds(null);
    return localDate.toISOString().slice(0, -1);
}

// global vars
var analResults
function getNumberOfTrends(cycle) {
    let r = analResults[cycle.group.id]
    if (r != undefined) {
        let j = r.trends[cycle.id]
        if (j != undefined) {
            return j.map(x => Object.values(x[1]).filter(y => y != 0).length).reduce((partialSum, a) => partialSum + a, 0)
        } else {
            return 0
        }
    } else {
        return 0
    }
}

var groups = []
var cycles = new Map()
var order = []

function getAnalysis() {  
    let results = {}
    for (let group of groups) {
        results[group.id] = group.analyze()
    }
    return results
}

// UI
var currentCycle
function renderPopup(cyc) {
    document.getElementById("name").innerText = cyc.name
    document.getElementById("avglabel").innerText = cyc.label

    document.getElementById("group").innerHTML = ""
    for (let g of groups) {
        let opt = document.createElement("option")
        opt.innerText = g.name
        opt.value = g.id
        if (g.id == cyc.group.id) {
            opt.selected = true
        }
        document.getElementById("group").appendChild(opt)
    }

    document.getElementById("avgintensity").innerText = cyc.events.length > 0 ? Math.round(Analyze.extractIntensities(cyc.events).reduce((a, b) => a + b) / cyc.events.length*100)/100 : "No logs"

    document.getElementById("barchart").innerHTML = ""
    if (cyc.events.length > 0) {
        let max = Math.ceil(Math.max(...Analyze.extractIntensities(cyc.events)))
        let min = Math.floor(Math.min(...Analyze.extractIntensities(cyc.events)))
        let diffs = []
        for (let index = 0; index < cyc.events.length - 1; index++) {
            diffs.push(cyc.events[index + 1].date - cyc.events[index].date)
        }
        let maxDiff = Math.max(...diffs)
        for (let index = 0; index < cyc.events.length; index++) {
            let e = cyc.events[index]
            let bar = document.createElement("button")
            bar.className = "bar"
            bar.style.height = `${max == min ? 100 : (e.intensity - min)/(max-min)*100}%`
            document.getElementById("barchart").appendChild(bar)
            if (index != cyc.events.length - 1) {
                let spacer = document.createElement("div")
                spacer.style.flex = diffs[index]/maxDiff
                document.getElementById("barchart").appendChild(spacer)
            }
            bar.onclick = () => {
                if (confirm("Delete log?")) {
                    cyc.removeEvent(index)
                    render()
                    renderPopup(currentCycle)
                }
            }
        }
        document.getElementById("cmax").innerText = max
        document.getElementById("cmin").innerText = min
        let minDate = new Date(cyc.events[0].date*60000)
        let maxDate = new Date(cyc.events[cyc.events.length - 1].date*60000)
        document.getElementById("dmin").innerText = `${minDate.getMonth() + 1}.${minDate.getDate()}.${minDate.getFullYear()}`
        document.getElementById("dmax").innerText = `${maxDate.getMonth() + 1}.${maxDate.getDate()}.${maxDate.getFullYear()}`
    } else {
        document.getElementById("cmax").innerText = 0
        document.getElementById("cmin").innerText = 0
        document.getElementById("dmin").innerText = ``
        document.getElementById("dmax").innerText = ``
        document.getElementById("barchart").innerHTML = `<button class="bar" style="width:100%; height:100%; background-color:rgba(0, 0, 0, 0.2)"></button>`
    }

    document.getElementById("pottrends").innerText = document.getElementById("allTrends").className.includes("formalive") ? document.getElementById("pottrends").innerText : `${cyc.events.length > 0 ? getNumberOfTrends(cyc) : "0"} potential trend${getNumberOfTrends(cyc) == 1 ? "" : "s"} found`

    if (cyc.events.length > 1) {
        let preds = analResults[cyc.group.id].predictions[cyc.id]
        if (preds != undefined) {
            if (preds[0] != undefined) {
                let d = new Date((cyc.events[cyc.events.length - 1].date + preds[0])*60*1000)
                document.getElementById("datepredict").innerText = `Date: ${["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][d.getDay()]}, ${["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][d.getMonth()]} ${d.getDate()}, ${d.getFullYear()} at ${d.getHours() == 0 ? 12 : (d.getHours() % 12)} ${d.getHours() < 12 ? "AM" : "PM"}`
            } else {
                document.getElementById("datepredict").innerText = "Date: Not enough data"
            }
            if (preds[1] != undefined) {
                document.getElementById("intensitypredict").innerText = `${cyc.label}: ~` + Math.round(preds[1]*10)/10
            } else {
                document.getElementById("intensitypredict").innerText = `${cyc.label}: Not enough data`
            }
        }
    } else {
        document.getElementById("datepredict").innerText = "Date: Not enough data"
        document.getElementById("intensitypredict").innerText = `${cyc.label}: Not enough data`
    }
}
function raisePopup(id) {
    for (let x of document.getElementsByClassName("showingPanel")) {
        x.classList.remove("showingPanel")
    }

    let cyc = cycles.get(id)
    document.getElementById("poo").style.zIndex = 3
    document.getElementById("po").style.translate = "0 0"
    document.getElementById("poo").style.backdropFilter = "blur(10vmin)  saturate(0.5)"
    
    currentCycle = cyc

    renderPopup(cyc)
}
function lowerPopup() {
    closetrends()
    cancelNewLog()
    document.getElementById("poo").style.backdropFilter = ""
        document.getElementById("po").style.translate = ""
    setTimeout(() => {
        document.getElementById("poo").style.zIndex = -1
    }, 300)
}

function activateNewLogger() {
    document.getElementById("time").value = toLocalISOString(new Date())
    document.getElementById("val").value = 5
    document.getElementById("formvallabel").innerText = currentCycle.label
    document.getElementById("addlog").className = "formset formalive"
}
function cancelNewLog() {
    document.getElementById("addlog").className = "formset"
}
function registerNewLog() {
    currentCycle.registerEvent(new Event(new Date(document.getElementById("time").value), parseFloat(document.getElementById("val").value)))
    render()
    renderPopup(currentCycle)
    cancelNewLog()
}

function editGroup() {
    document.getElementById("gn").value = currentCycle.group.name
    document.getElementById("addGroup").className = "formset formalive"
    document.getElementById("cng").innerText = "Cancel"
    document.getElementById("sng").onclick = () => {
        currentCycle.group.name = document.getElementById("gn").value
        renderPopup(currentCycle)
        render()
        cancelNewGroup()
    }
}
function newGroup() {
    document.getElementById("gn").value = "New Group"
    document.getElementById("cng").innerText = "Cancel"
    document.getElementById("addGroup").className = "formset formalive"
    document.getElementById("sng").onclick = registerNewGroup
}
function cancelNewGroup() {
    document.getElementById("addGroup").className = "formset"
}
function registerNewGroup() {
    let g = new Group(document.getElementById("gn").value)
    currentCycle.group.removeCycle(currentCycle.id)
    g.registerCycle(currentCycle)
    renderPopup(currentCycle)
    render()
    cancelNewGroup()
}
function changeGroup(i) {
    currentCycle.group.removeCycle(currentCycle.id)
    for (let g of groups) {
        if (g.id == i) {
            g.registerCycle(currentCycle)
            break
        }
    }
    renderPopup(currentCycle);
    render()
}
function deleteGroup() {
    if ([...currentCycle.group.cycles.keys()].length > 1) {
        alert("Remove all other cycles from this group first.")
    } else if (groups.length < 2) {
        alert("There must be at least one group.")
    } else {
        currentCycle.group.removeCycle(currentCycle.id)
        currentCycle.group.deregister()
        groups[0].registerCycle(currentCycle)    
        renderPopup(currentCycle)
        render()
    }
}

function addTrendsToBox(type, cyc1, cyc2, prop) {
    if (prop != 0) {
        let div = document.createElement("div")
        div.className = "box trendstat"
    
        let propHead = document.createElement("h2")
        propHead.innerHTML = `${Math.round(prop*100)}%`
        div.appendChild(propHead)
    
        let sp = document.createElement("span")
        if (prop > 0) {
            switch (type) {
                case "ii1":
                    sp.innerText = `Higher ${cyc1.label} (${cyc1.name}) = Higher ${cyc2.label} (${cyc2.name})`
                    break
                case "ii2":
                    sp.innerText = `Higher ${cyc2.label} (${cyc2.name}) = Higher ${cyc1.label} (${cyc1.name})`
                    break
                case "fi1":
                    sp.innerText = `Higher Frequency (${cyc1.name}) = Higher ${cyc2.label} (${cyc2.name})`
                    break
                case "fi2":
                    sp.innerText = `Higher Frequency (${cyc2.name}) = Higher ${cyc1.label} (${cyc1.name})`
                    break
                case "ff1":
                    sp.innerText = `Higher Frequency (${cyc1.name}) = Higher Frequency (${cyc2.name})`
                    break
                case "ff2":
                    sp.innerText = `Higher Frequency (${cyc2.name}) = Higher Frequency (${cyc1.name})`
                    break
            }
        } else {
            switch (type) {
                case "ii1":
                    sp.innerText = `Higher ${cyc1.label} (${cyc1.name}) = Lower ${cyc2.label} (${cyc2.name})`
                    break
                case "ii2":
                    sp.innerText = `Higher ${cyc2.label} (${cyc2.name}) = Lower ${cyc1.label} (${cyc1.name})`
                    break
                case "fi1":
                    sp.innerText = `Higher Frequency (${cyc1.name}) = Lower ${cyc2.label} (${cyc2.name})`
                    break
                case "fi2":
                    sp.innerText = `Higher Frequency (${cyc2.name}) = Lower ${cyc1.label} (${cyc1.name})`
                    break
                case "ff1":
                    sp.innerText = `Higher Frequency (${cyc1.name}) = Lower Frequency (${cyc2.name})`
                    break
                case "ff2":
                    sp.innerText = `Higher Frequency (${cyc2.name}) = Lower Frequency (${cyc1.name})`
                    break
            }
        }
        div.appendChild(sp)
        document.getElementById("allTrends").appendChild(div)
    }
}
function activateTrends() {
    document.getElementById("pottrends").innerText = "Hide trends"
    document.getElementById("pottrends").onclick = closetrends
    document.getElementById("allTrends").className = "formset formalive"
    document.getElementById("allTrends").innerHTML = ""
    for (let cycRes of analResults[currentCycle.group.id].trends[currentCycle.id]) {
        if (Object.values(cycRes[1]).filter(x => x != 0).length > 0) {
            let cyc2 = cycles.get(cycRes[0])
            addTrendsToBox("ii1", currentCycle, cyc2, cycRes[1]["ii1"])
            addTrendsToBox("ii2", currentCycle, cyc2, cycRes[1]["ii2"])
            addTrendsToBox("fi1", currentCycle, cyc2, cycRes[1]["fi1"])
            addTrendsToBox("fi2", currentCycle, cyc2, cycRes[1]["fi2"])
            addTrendsToBox("ff1", currentCycle, cyc2, cycRes[1]["ff1"])
            addTrendsToBox("ff2", currentCycle, cyc2, cycRes[1]["ff2"])
        }
    }
}
function closetrends() {
    document.getElementById("allTrends").className = "formset"
    document.getElementById("pottrends").innerText = `${currentCycle.events.length > 0 ? getNumberOfTrends(currentCycle) : "0"} potential trends found`
    document.getElementById("pottrends").onclick = activateTrends
}

function changeILabel(field) {
    currentCycle.label = field.innerText
    renderPopup(currentCycle)
    putToStorage()
}
function changeName(field) {
    currentCycle.name = field.innerText
    render()
}

function addCycle() {
    let cyc = new Cycle("New Cycle")
    groups[0].registerCycle(cyc)
    order.push(cyc.id)
    render()
    raisePopup(cyc.id)
}

function deleteCycle() {
    let sure = confirm(`Delete ${currentCycle.name}?`)
    if (sure) {
        currentCycle.group.removeCycle(currentCycle.id)
        order.splice(order.indexOf(currentCycle.id), 1)
        lowerPopup()
        render()
    }
}

// persistence
function putToStorage() {
    localStorage.setItem('data', JSON.stringify({
        "gs": groups.map(x => x.toString()),
        "order": order
    }))
}
function getFromStorage() {
    let stored = localStorage.getItem("data")
    if (stored != undefined) {
        for (let g of JSON.parse(stored)["gs"]) {
            Group.parseString(g)
        }
        order = JSON.parse(stored)["order"]
    } else {
        order = [...cycles.entries()].map(x => x[0])
        new Group("Group 1")
        toggleHelp()
    }
}

// init
function render() {
    analResults = getAnalysis()
    console.log(analResults)
    document.getElementById("cycles").innerHTML = ""
    for (let key of order) {
        let cycle = cycles.get(key)
        let cont = document.createElement("button")
        cont.draggable = true
        cont.dataset.id = key
        cont.className = "cycle box"
        
        let name = document.createElement("h3")
        name.innerText = cycle.name
        cont.appendChild(name)
    
        let group = document.createElement("span")
        group.innerText = cycle.group.name
        cont.appendChild(group)
    
        let stats = document.createElement("div")
        stats.className = "stats"
    
        let addStat = (val, name) => {
            let sb = document.createElement("div")
            sb.className = "statBox"
            sb.innerHTML = `<h2>${val}</h2> ${name}`
            stats.appendChild(sb)
        }
        addStat(cycle.events.length, "logs")
        addStat(cycle.events.length > 0 ? Math.round(Analyze.extractIntensities(cycle.events).reduce((a, b) => a + b) / cycle.events.length*10)/10 : "?", "avg")
        if (cycle.events.length > 0) {
            let foundtrends = getNumberOfTrends(cycle)
            addStat(foundtrends, `trend${foundtrends == 1 ? "" : "s"}`)
        } else {
            addStat("?", "trends")
        }
    
        cont.onclick = () => {
            raisePopup(cycle.id)
        }
    
        cont.appendChild(stats)
    
        document.getElementById("cycles").appendChild(cont)
    }

    putToStorage()
}
window.addEventListener("load", () => {
    if (window.matchMedia('(display-mode: standalone)').matches || window.location.href.endsWith("?try")) {
        getFromStorage()
        render()
        
        if (localStorage.getItem("chill") == "t") {
            document.getElementById("chilltoggle").checked = true
            toggleChill(true)
        }
    
        if (window.matchMedia('(display-mode: standalone)').matches) {
            document.documentElement.style.setProperty('--pwa-top-offset', '30px');
        } else if (window.mobileAndTabletCheck()) {
            document.getElementById("hint").style.scale = "1"
            document.getElementById("hint").style.height = "fit-content"
            document.getElementById("hint").style.backgroundPosition = "right"
            setTimeout(() => {
                document.getElementById("hint").style.scale = ""
                document.getElementById("hint").style.height = ""
            }, 10000)
        }
    } else {
        window.location.href = "landing.html"
    }
})

const container = document.getElementById("cycles");
let draggedElement = null;

// Event listeners for drag events
container.addEventListener("dragstart", (e) => {
    if (e.target.classList.contains("cycle")) {
        draggedElement = e.target;
    }
});

container.addEventListener("dragend", (e) => {
    order = [...document.getElementById("cycles").children].map(x => x.dataset.id)
    putToStorage()
});

container.addEventListener("dragover", (e) => {
    e.preventDefault(); // Allow dropping
    const afterElement = getDragAfterElement(container, e.clientX, e.clientY);
    if (afterElement == null) {
    container.appendChild(draggedElement);
    } else {
    container.insertBefore(draggedElement, afterElement);
    }
});

var currentTouchId
var touchLength = 0
container.addEventListener("touchstart", (e) => {
    const touch = e.touches[0];
    const target = e.target;
    currentTouchId = setInterval(() => {
        touchLength++
    }, 10)
    if (target.classList.contains("cycle")) {
        draggedElement = target;
        touchStartX = touch.clientX;
        touchStartY = touch.clientY;
    }
});

container.addEventListener("touchmove", (e) => {
    if (touchLength > 20) {
        e.preventDefault(); // Prevent scrolling
        const touch = e.touches[0];
        const afterElement = getDragAfterElement(container, touch.clientX, touch.clientY);
        if (afterElement == null) {
            container.appendChild(draggedElement);
        } else {
            container.insertBefore(draggedElement, afterElement);
        }
    }
});

container.addEventListener("touchend", () => {
    if (draggedElement) {
        draggedElement = null;
    }
    order = [...document.getElementById("cycles").children].map(x => x.dataset.id)
    putToStorage()

    clearInterval(currentTouchId)
    touchLength = 0
});
  

// Function to determine the position of the dragged element
function getDragAfterElement(container, x, y) {
    const draggableElements = [...container.querySelectorAll(".cycle:not(.dragging)")];
    
    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offsetX = x - box.right; // Compare the x-coordinate with the right edge
        const offsetY = Math.abs(y - (box.top + box.height / 2)); // Align vertically
    
        // Only consider elements where the dragged item is past their left edge
        if (offsetX < 0 && offsetY < box.height / 2 && Math.abs(offsetX) < closest.offsetX) {
          return { offsetX: Math.abs(offsetX), element: child };
        }
        return closest;
      }, { offsetX: Number.POSITIVE_INFINITY }).element;
}

function toggleSettings() {
    try {
        document.getElementById("cachen").innerText = cacheName
    } catch (e) {
        document.getElementById("cachen").innerText = "offline"
    }
    let ll = document.getElementById("settings").classList
    if (ll.contains("showingPanel")) {
        ll.remove("showingPanel")
    } else {
        for (let x of document.getElementsByClassName("showingPanel")) {
            x.classList.remove("showingPanel")
        }
        ll.add("showingPanel")
    }
}
function toggleHelp() {
    let ll = document.getElementById("help").classList
    if (ll.contains("showingPanel")) {
        ll.remove("showingPanel")
    } else {
        for (let x of document.getElementsByClassName("showingPanel")) {
            x.classList.remove("showingPanel")
        }
        ll.add("showingPanel")
    }
}
function toggleChill(x) {
    if (x) {
        document.getElementsByClassName("bg")[0].classList.add("chillbg")
        document.getElementsByClassName("chart")[0].classList.add("chillchart")
    } else {
        document.getElementsByClassName("bg")[0].classList.remove("chillbg")
        document.getElementsByClassName("chart")[0].classList.remove("chillchart")
    }
    localStorage.setItem("chill", x ? "t" : "f")
}

function tutorial() {
    for (let x of document.getElementsByClassName("showingPanel")) {
        x.classList.remove("showingPanel")
    }
    let disabledBtns = []
    document.getElementById("tutText").hidden = false
    document.getElementById("tutText").innerText = "First, click Add Cycle."
    for (let b of document.getElementsByTagName("button")) {
        if (b.id != "tut1") {
            if (b.disabled == false) {
                disabledBtns.push(b)
            }
            b.disabled = true
        } else {
            b.addEventListener("click", () => {
                b.disabled = true
                document.getElementById("tutText").innerText = "Tap on where it says New Cycle and give it a name. Maybe 'Coffee'?"
                document.getElementById("name").addEventListener("blur", () => {
                    document.getElementById("tutText").innerText = "Choose a group. We only look for relationships between cycles if they're in the same group.\n\nThen, tap on the underlined part of Average Intensity."
                    document.getElementById("avglabel").addEventListener("focusin", () => {
                        document.getElementById("tutText").innerText = "You can edit this to be whatever you want. Since this cycle is for coffee, maybe Quantity?"
                        document.getElementById("avglabel").addEventListener("blur", () => {  
                            document.getElementById("tutText").innerText = "Great! Now tap Add Log to log your first cup of coffee."
                            document.getElementById("tut2").disabled = false
                            document.getElementById("tut2").addEventListener("click", () => {
                                document.getElementById("tutText").innerText = "For now, we'll just go with what's already there. Tap Save."
                                document.getElementById("tut2").disabled = true
                                document.getElementById("tut3").disabled = false
                                document.getElementById("tut3").addEventListener("click", () => {
                                    document.getElementById("tutText").innerText = "Great! That pink rectangle is a bar. When you add more logs, more bars will show up in the chart. You can tap the rectangle to delete a log. For now, tap below where it says X potential trends found."
                                    document.getElementById("pottrends").disabled = false
                                    document.getElementById("pottrends").addEventListener("click", () => {
                                        document.getElementById("tutText").innerText = "Once the app finds some relationships, they'll show up here. The app will also make predictions below, where it says Prediction.\n\nThanks for taking part in this tutorial! Tap the Close button below Prediction to finish."
                                        document.getElementById("tutlast").disabled = false
                                        document.getElementById("tutlast").addEventListener("click", () => {
                                            for (let btn of disabledBtns) {
                                                btn.disabled = false
                                                document.getElementById("tutText").hidden = true
                                            }
                                        }, { once: true })
                                    }, { once: true })
                                }, { once: true })
                            }, { once: true })
                        }, { once: true })
                    }, { once: true })
                }, { once: true })
            }, { once: true })
        }
    }
}