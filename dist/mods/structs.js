function uuidv4() {
    return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, c =>
      (+c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> +c / 4).toString(16)
    );
  }

class Cycle {
    constructor(name) {
        this.events = []
        this.name = name
        this.label = "Intensity"
        this.id = uuidv4()
        this.group = null
    }
    registerEvent(ev) {
        this.events.push(ev)
        this.events.sort((a, b) => a.date - b.date)
    }
    removeEvent(i) {
        this.events.splice(i, 1)
    }
    toString() {
        return JSON.stringify({
            "name": this.name,
            "label": this.label,
            "id": this.id,
            "events": this.events.map(x => x.toString())
        })
    }
    static parseString(str) {
        let d = JSON.parse(str)
        let c = new Cycle(d["name"])
        c.label = d["label"]
        c.id = d["id"]
        let events = d["events"].map(x => Event.parseString(x))
        for (let e of events) {
            c.registerEvent(e)
        }
        return c
    }
}

class Event {
    constructor(date, intensity) {
        this.date = Math.round(date.getTime() / 60000)
        this.intensity = intensity
    }
    toString() {
        return `${this.date}/${this.intensity}`
    }
    static parseString(str) {
        let d = parseInt(str.split("/")[0])
        let i = parseFloat(str.split("/")[1])
        let e = new Event(new Date("1/1/2024"), 0)
        e.date = d
        e.intensity = i
        return e
    }
}

class Group {
    constructor(name) {
        this.cycles = new Map()
        this.name = name
        this.id = uuidv4()
        groups.push(this)
    }
    toString() {
        return JSON.stringify(
            {
                "name": this.name,
                "id": this.id,
                "cycles": [...this.cycles.values()].map(x => x.toString())
            }
        )
    }
    static parseString(str) {
        let d = JSON.parse(str)
        let g = new Group(d["name"])
        g.id = d["id"]
        for (let c of d["cycles"]) {
            g.registerCycle(Cycle.parseString(c))
        }
        return g
    }
    registerCycle(cyc) {
        this.cycles.set(cyc.id, cyc)
        cyc.group = this
        cycles.set(cyc.id, cyc)
    }
    removeCycle(id) {
        cycles.delete(id)
        this.cycles.delete(id)
    }
    deregister() {
        groups.splice(groups.indexOf(this), 1)
    }
    analyze() {
        let trends = {}
        let cyclist = [...this.cycles.values()]
        for (let i = 0; i < cyclist.length - 1; i++) {
            for (let j = i + 1; j < cyclist.length; j++) {
                let events1 = cyclist[i].events
                let events2 = cyclist[j].events
                if (events1.length > 0 && events2.length > 0) {
                    let results = {
                        // Does drinking more coffee cause higher intensity migraines?
                        "ii1": Analyze.intensityToIntensity(events1, events2),
                        "ii2": Analyze.intensityToIntensity(events2, events1),
                        // Does drinking more coffee cause higher frequency migraines?
                        "fi1": Analyze.frequencyToIntensity(events1, events2),
                        "fi2": Analyze.frequencyToIntensity(events2, events1),
                        // Does drinking coffee more frequently cause higher frequency migraines?
                        "ff1": Analyze.frequencyToFrequency(events1, events2),
                        "ff2": Analyze.frequencyToFrequency(events2, events1)
                    }
                    if (trends[cyclist[i].id] == undefined) {
                        trends[cyclist[i].id] = [[cyclist[j].id, results]]
                    } else {
                        trends[cyclist[i].id].push([cyclist[j].id, results])
                    }
                    if (trends[cyclist[j].id] == undefined) {
                        trends[cyclist[j].id] = [[cyclist[i].id, results]]
                    } else {
                        trends[cyclist[j].id].push([cyclist[i].id, results])
                    }
                }
            }
        }
        
        let predictions = {}
        for (let cyc of cyclist) {
            if (cyc.events.length > 0) {
                predictions[cyc.id] = Analyze.predictNext(cyc.events, 2)
            }
        }

        return {
            "trends": trends,
            "predictions": predictions
        }
    }
}