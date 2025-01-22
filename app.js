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

// service worker for PWA offline
if ('serviceWorker' in navigator) {
    window.addEventListener('load' , () => {
        navigator.serviceWorker.register('/sw.js')
                  .then(registration => {
            console.log('Service Worker registered with scope:' , registration.scope);
        }).catch(error => {
            console.log('Service Worker registration failed:' , error);
        });
    });
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
        for (let index = 0; index < cyc.events.length; index++) {
            let e = cyc.events[index]
            let bar = document.createElement("button")
            bar.className = "bar"
            bar.style.height = `${(e.intensity - min)/max*100}%`
            document.getElementById("barchart").appendChild(bar)
            bar.onclick = () => {
                cyc.removeEvent(index)
                render()
                renderPopup(currentCycle)
            }
        }
        document.getElementById("cmax").innerText = max
        document.getElementById("cmin").innerText = min
        let minDate = new Date(cyc.events[0].date*3600000)
        let maxDate = new Date(cyc.events[cyc.events.length - 1].date*3600000)
        document.getElementById("dmin").innerText = `${minDate.getMonth() + 1}.${minDate.getDate()}.${minDate.getFullYear()}`
        document.getElementById("dmax").innerText = `${maxDate.getMonth() + 1}.${maxDate.getDate()}.${maxDate.getFullYear()}`
    } else {
        document.getElementById("cmax").innerText = 0
        document.getElementById("cmin").innerText = 0
        document.getElementById("barchart").innerHTML = `<button class="bar" style="width:100%; height:100%; background-color:rgba(0, 0, 0, 0.2)"></button>`
    }

    document.getElementById("pottrends").innerText = document.getElementById("allTrends").className.includes("formalive") ? document.getElementById("pottrends").innerText : `${cyc.events.length > 0 ? getNumberOfTrends(cyc) : "0"} potential trends found`

    if (cyc.events.length > 0 && cyc.group.cycles.length > 1) {
        let preds = analResults[cyc.group.id].predictions[cyc.id]
        if (preds != undefined) {
            if (preds[0] != undefined) {
                let d = new Date((cyc.events[cyc.events.length - 1].date + preds[0])*60*60*1000)
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
    document.getElementById("time").value = ""
    document.getElementById("val").value = 5
    document.getElementById("formvallabel").innerText = currentCycle.label
    document.getElementById("addlog").className = "formset formalive"
}
function cancelNewLog() {
    document.getElementById("addlog").className = "formset"
}
function registerNewLog() {
    currentCycle.registerEvent(new Event(new Date(document.getElementById("time").value), document.getElementById("val").value))
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
    document.getElementById("gn").value = ""
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
    }
}

// init
function render() {
    analResults = getAnalysis()
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
            addStat(foundtrends, "trends")
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
    getFromStorage()
    render()
    
    if (window.matchMedia('(display-mode: standalone)').matches) {
        document.documentElement.style.setProperty('--pwa-top-offset', '30px');
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

container.addEventListener("touchstart", (e) => {
    const touch = e.touches[0];
    const target = e.target;
    if (target.classList.contains("cycle")) {
        draggedElement = target;
        touchStartX = touch.clientX;
        touchStartY = touch.clientY;
    }
});

container.addEventListener("touchmove", (e) => {
    e.preventDefault(); // Prevent scrolling
    const touch = e.touches[0];
    const afterElement = getDragAfterElement(container, touch.clientX, touch.clientY);
    if (afterElement == null) {
        container.appendChild(draggedElement);
    } else {
        container.insertBefore(draggedElement, afterElement);
    }
});

container.addEventListener("touchend", () => {
    if (draggedElement) {
        draggedElement = null;
    }
    order = [...document.getElementById("cycles").children].map(x => x.dataset.id)
    putToStorage()
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