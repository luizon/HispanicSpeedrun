import { HTML_POJO } from "./HTML_POJO.js";

export class RunBar extends HTML_POJO {
	constructor(json) {
		super(json);
		this.hPosition = json.hPosition || 0;
		this.globalPosition = json.globalPosition || 0;
		this.country = json.country || "";
		this.countryCode = json.countryCode || "";
		this.player = json.player || "Sin nombre";
		this.url = json.url || "";
		this.comment = json.comment || "";
		this.time = json.time || "error";
		this.date = json.date || "error";
		this.subcategory = json.subcategory || "";
		this.flag = this.img({
			src : `https://speedrun.com/images/flags/${this.countryCode}.png`,
			alt : '',
			class_ : "runner-flag",
			title : this.country,
		});
		if(this.hPosition < 5) {
			if(topImg[this.hPosition])
				this.hPosition = this.img({
					src : topImg[this.hPosition],
					title : this.hPosition,
					class_ : "position-img",
				});
			}
			if(this.globalPosition < 5) {
				if(topImg[this.globalPosition])
					this.globalPosition = this.img({
						src : topImg[this.globalPosition],
						title : this.globalPosition,
						class_ : "position-img",
					});
		}

		this.generateInnerHTML();
		this.insertNode();
		// this.updateHTML();
	}

	async upadateHTML() {
		this.innerHTML = this.generateInnerHTML();
		let thisRunBar = $(`#${this.id}`);
		console.log(this.node)
		thisRunBar.html(this.innerHTML);
	}
	
	generateInnerHTML() {
		this.node.classList.add("run-bar", "row");
		this.innerHTML = 
				this.div({class_ : 'col run-bar-position', innerHTML : this.hPosition })
			+ this.div({class_ : 'col run-bar-position', innerHTML : this.globalPosition })
			+ this.div({class_ : 'col run-bar-runner', innerHTML : (this.countryCode ? `${this.flag} ` : "") + `${this.player}` }) // si no tiene bandera, no se pondra el espacio
			+ this.div({class_ : 'col run-bar-time', innerHTML : this.time })
			+ ( this.subcategory ? this.div({class_ : 'col run-bar-date d-none d-sm-none d-md-block d-lg-block d-xl-block', innerHTML : `${this.subcategory}`}) : "" ) // sin subcategoria no se pondra esta columna
			+ this.div({class_ : 'col run-bar-date d-none d-sm-block d-md-block d-lg-block d-xl-block', innerHTML : this.date });
		if(this.url)
			this.innerHTML = this.a({title: this.comment, class_ : 'row m-0 p-0', url : this.url, innerHTML : this.innerHTML });
	}
}