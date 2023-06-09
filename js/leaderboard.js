import { RunBar } from "./POO/RunBar.js";
import { formatTime } from "./functions.js"

var runnersArray = []; // se usa solo en la funcion "legacy" de createRunBars con API v1
var hPosition = 1;
var runsArray = []; // array de runs (para cargar con api v2)
var playersArray = []; // array de jugadores (para cargar con api v2)
var runsDiv = null, runsDivLoading = null;
var leaderboard = {
	game : {
		ID : null,
	},
	category : {
		ID : null,
		name : null,
	},
	subcategories : [],
	variables : {},
	runners : {}
};
var startedAt = null;
var finished = false;

async function luizonShouldOptimizeThisWebPage() {
	while(!finished) {//!finished) {
		await sleep(333);
		if($("#loadingLeaderboardText") > 0)
			if((new Date() - startedAt.getTime()) / 1000 > 10 && $("#loadingLeaderboardText").html().length == 0)
				$("#loadingLeaderboardText").html("Speedrun.com está demorándose en contestar, por favor espere.");
	}
}

function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}
// function getSubcategories(json = {}) {
// 	if(subcategoriesString.length == 0) // no hay subcategorias
// 		return "";
// 	let output = "";
// 	let subcategoryName = json.name || false;
// 	let subcategoryValue = json.label || false;
// 	if(subcategoryName && subcategoryValue) {
// 		subcategories = subcategoriesString.split(",");
// 		subcategories.forEach( subcategory => {
// 			subcategory = subcategory.split("@");
// 			output+= subcategory[0] + "@";
// 			if(subcategory[0].toLowerCase() == subcategoryName.toLowerCase())
// 				output+= subcategoryName + ",";
// 			else
// 				output+= subcategory[1] + "@";
// 		});
// 		output = output.substring(0, output.length - 1);
// 	}
// 	return output;
// }
  
async function loadCategories(json) {
	let apiURL = `${SPEEDRUN_API}/games/${json.game}?embed=categories`;
	await $.get(apiURL)
		.done(apiAnswer => {
			// console.log(apiAnswer);
			$("html").get(0).style.backgroundImage = `url('${apiAnswer.data.assets["cover-small"].uri}')`; // background
			if($("#divDiscord")[0].href.length == 0) {
				$("#divDiscord")[0].href = apiAnswer.data.discord;
				$("#divDiscord")[0].title = `Comunidad angloparlante de ${apiAnswer.data.names.international}`;
			}
			if(apiAnswer.data.assets["trophy-1st"])
				topImg[1] = apiAnswer.data.assets["trophy-1st"].uri;
			if(apiAnswer.data.assets["trophy-2nd"])
				topImg[2] = apiAnswer.data.assets["trophy-2nd"].uri;
			if(apiAnswer.data.assets["trophy-3rd"])
				topImg[3] = apiAnswer.data.assets["trophy-3rd"].uri;
			if(apiAnswer.data.assets["trophy-4th"])
				topImg[4] = apiAnswer.data.assets["trophy-4th"].uri;
			leaderboard.game.ID = apiAnswer.data.id;
			let categories = [];
			leaderboard.category.name = null;
			leaderboard.category.ID = null;
			$("#categories").html("");
			let idCounter = 0;
			apiAnswer.data.categories.data.forEach((iCategory) => {
				if(iCategory.type == "per-level")
					return false;
				categories.push(iCategory);
				let categoryNode = document.createElement("a");
				categoryNode.innerHTML = iCategory.name;
				categoryNode.classList.add("btn", "btn-secondary", "me-2", "mb-2");
				categoryNode.id = "btnCa" + idCounter++;
				let url = `../leaderboard?juego=${json.game}&categoria=${iCategory.name.replace(/ /g, "_").replace(/%/g, "")}`;
				categoryNode.href = `javascript:redirectTo("${url}", getSubcategories());`;
				if(urlParams.has('categoria'))
					if(urlParams.get('categoria').toLowerCase() == iCategory.name.toLowerCase().replace(/ /g, "_").replace(/%/g, "")) {
						leaderboard.category.name = iCategory.name;
						leaderboard.category.ID = iCategory.id;
						categoryNode.classList.add("btn-active");
					}
				
				let elmentListNode = document.createElement("li");
				elmentListNode.appendChild(categoryNode);
				$("#categories").append(elmentListNode);
			});
			if(leaderboard.category.name == null) {
				leaderboard.category.name = categories[0].name;
				leaderboard.category.ID = categories[0].id;
				$("#btnCa0").addClass("btn-active");
			}

			$("#divGameTitle").html(`${apiAnswer.data.names.international} - ${ leaderboard.category.name }`);
		})
		.fail(err => {
			finished = true;
			errorLoadingRuns('Ocurrió un error al intentar cargar la información del juego.');
			$("#subcategories").remove();
			$("#categories").remove();
			$("#divGameTitle").remove();
			console.log('error al cargar la info del juego');
			console.log(err);
			if(err.responseJSON)
				if(err.responseJSON.message) {
					// alert(err.responseJSON.message);
					$("#loadingLeaderboardText").html($("#loadingLeaderboardText").html()
						+ "<br><br><h6 style='text-align: left;font-weight: normal;'>Respuesta de speedrun.com:"
						+ `<br>${err.responseJSON.message}</h6>`
					);
				}
	});
}

function errorLoadingRuns(message) {
	$("#loadingLeaderboard").remove();
	$(".loading-leaderboard-img").remove();
	$("#loadingLeaderboardText").html(message);
}

async function loadSubcategories(categoryID) {
	let apiURL = `${SPEEDRUN_API}/categories/${categoryID}/variables`;
	await $.get(apiURL)
		.done(apiAnswer => {
			let variables = apiAnswer.data
			// console.log(apiAnswer);
			let hasSubcategories = false;
			let numberOfSubcategories = 0;
			variables.forEach(variable => {
				let i = 0;
				if(variable['is-subcategory']) {
					if(numberOfSubcategories > 0) {
						$("#subcategories").append(document.createElement("br"));
					}
					numberOfSubcategories++;
					console.log(variable);
					hasSubcategories = true;
					let newSubcategory = {
						key : variable.id,
						name : variable.name
					}
					let subcategoryKey = Object.keys(variable.values.values)[0];
					let subcategoryLabel = "";
					for(let iSubcategoryKey in variable.values.values) {
						let iSubcategoryLabel = variable.values.values[iSubcategoryKey].label;
						let iSubcategoryName = variable.name.toLowerCase().replace(/ /g, "_").replace(/%/g, "");
						let subcategoryNode = document.createElement("a");
						subcategoryNode.innerHTML = iSubcategoryLabel;
						subcategoryNode.classList.add("btn", "btn-secondary", "mb-2");
						subcategoryNode.id = `btnSubCa_${numberOfSubcategories}_${i++}`;
						iSubcategoryLabel = iSubcategoryLabel.replace(/ /g, "_").replace(/%/g, "");
						if(urlParams.has('subcategorias')) {
							let subcategories = urlParams.get('subcategorias').toLowerCase().split(",");
							subcategories.forEach( subcategory => {
								subcategory = subcategory.split("@");
								if(subcategory[0] == iSubcategoryName && subcategory[1] == iSubcategoryLabel.toLowerCase()) {
									console.log(subcategory)
									subcategoryKey = iSubcategoryKey;
									subcategoryNode.classList.add("btn-active");
									subcategoryLabel = iSubcategoryLabel;
								}
							});
						}
		
						let category = leaderboard.category.name.replace(/ /g, "_").replace(/%/g, "");
						let url = `../leaderboard?juego=${urlParams.get('juego')}&categoria=${category}`;
						subcategoryNode.href = `javascript:redirectTo("${url}", getSubcategories({"name":"${variable.name.replace(/ /g, "_").replace(/%/g, "")}", "label":"${iSubcategoryLabel.replace(/ /g, "_").replace(/%/g, "")}"}));`
						let elmentListNode = document.createElement("li");
						elmentListNode.appendChild(subcategoryNode);
						$("#subcategories").append(elmentListNode);

					}
					// variable.values.values[subcategoryKey].rules; // reglas
					if(subcategoryKey == Object.keys(variable.values.values)[0]) {
						$(`#btnSubCa_${numberOfSubcategories}_0`)[0].classList.add("btn-active");
						subcategoryLabel = variable.values.values[Object.keys(variable.values.values)[0]].label;
					}

					if(subcategoriesString.length > 0)
						subcategoriesString+= ",";
					subcategoriesString+= variable.name.replace(/ /g, "_").replace(/%/g, "") + "@" + subcategoryLabel;

					newSubcategory.ID = subcategoryKey;
					newSubcategory.label = variable.values.values[subcategoryKey].label;
					leaderboard.subcategories.push(newSubcategory);
				}
				else {
					leaderboard.variables[variable.id] = {};
					leaderboard.variables[variable.id].name = variable.name;
					for(let iSubcategoryKey in variable.values.values) {
						let variableLabel = variable.values.values[iSubcategoryKey].label;
						leaderboard.variables[variable.id][iSubcategoryKey] = variableLabel;
					}
				}
			});
			$("#subcategories div").remove(); // remueve del documento al div de "cargando subcategorias"
			if(!hasSubcategories) {
				let subcategoryTextNode = document.createElement('p');
				subcategoryTextNode.innerHTML = `<strong>${leaderboard.category.name}</strong> no tiene subcategorías.`
				$("#subcategories").append(subcategoryTextNode);
			}
		})
		.fail(err => {
			finished = true;
			errorLoadingRuns('Ocurrió un error al intentar cargar las subcategorías del juego.');
			$("#subcategories").remove();
			console.log('error al cargar las subcategorias del juego');
			console.log(err);
			if(err.responseJSON)
				if(err.responseJSON.message) {
					// alert(err.responseJSON.message);
					$("#loadingLeaderboardText").html($("#loadingLeaderboardText").html()
						+ "<br><br><h6 style='text-align: left;font-weight: normal;'>Respuesta de speedrun.com:"
						+ `<br>${err.responseJSON.message}</h6>`
					);
				}
		});
	
	console.log(leaderboard.variables)
	let variables = "";
	for(let iVariable in leaderboard.variables) {
		variables+= `${leaderboard.variables[iVariable].name}, `;
	}
	if(variables)
		variables = variables.substring(0, variables.length - 2); // quita el ", " del final

	new RunBar({
		hPosition : "Ñ",
		globalPosition : "#",
		country : "País",
		player : "Runner",
		time : "Tiempo",
		date : "Fecha",
		subcategory : variables || "",
		parentNode: $("#runBarHeader")[0],
		class_ : `odd run-bar-header`,
	});
}

// API v1, carga demasiado lento
async function createRunBars(json) {
	// let hPosition = 1;
	let apiURL = `${SPEEDRUN_API}/leaderboards/${json.game}/category/${json.category}`;
	apiURL+= "?embed=players"; // info extra para mostrar
	if(leaderboard.subcategories.length > 0) { // subcategorias
		leaderboard.subcategories.forEach( (subcategory) => {
			apiURL+= `&var-${subcategory.key}=${subcategory.ID}`;
		});
	}
	console.log(leaderboard.subcategories)
	console.log(apiURL);
	if(urlParams.has("top")) {
		await insertRunBarsV1(apiURL, urlParams.get("top")); // limite definido por jugador
	}
	else {
		await insertRunBarsV1(apiURL, DEFAULT_LIMIT); // limite por defecto
		await insertRunBarsV1(apiURL); // carga todo lo que falta
	}
}

async function insertRunBarsV1(apiURL, top = false) {
	if(top)
		apiURL+= "&top=" + top;
	await $.get(apiURL)
		.done(apiAnswer => {
			console.log(apiAnswer)
			let runs = apiAnswer.data.runs;
			let players = apiAnswer.data.players;
			runnersArray = [];
			runs.forEach(async (run, i) => {
				if(!top)
					if(i < DEFAULT_LIMIT) // que no se inserten runners que ya se insertaron anteriormente
						return false;
				if(players.data[i].location == null) // hay runners que no tienen su pais puesto
					return false; // estos runners se omiten
				let runnersCountry = players.data[i].location.country.names.international;

				// si el pais no es hispano, no se agrega la run
				if(!Object.keys(HISPANIC_COUNTRYS).includes(runnersCountry.toLowerCase()))
					return false;
				let runnerName = players.data[i].names.international;
				runnersCountry = HISPANIC_COUNTRYS[runnersCountry.toLowerCase()]; // traduce pais a español

				let variables = "";
				for(let iVariable in run.run.values)
					if(leaderboard.variables[iVariable])
						variables+= `${leaderboard.variables[iVariable][run.run.values[iVariable]]}, `;
				if(variables)
					variables = variables.substring(0, variables.length - 2); // quita el ", " del final

				runnersArray.push(new RunBar({
					hPosition : hPosition++,
					globalPosition : run.place,
					countryCode : players.data[i].location.country.code,
					country : runnersCountry,
					player : runnerName,
					url : run.run.weblink,
					comment : run.run.comment,
					time : formatTime(run.run.times.primary_t),
					date : run.run.date,
					parentNode: runsDiv,
					subcategory : variables || '',
					class_ : `row-${hPosition % 2 > 0 ? 'odd' : 'even'}`,
				}));
			});
			if(runnersArray.length > 0 && (!top || urlParams.has("top")) || (!top && runnersArray.length <= DEFAULT_LIMIT))
				runsDiv.removeChild(runsDivLoading);
			else if(!top || urlParams.has("top")) {
				errorLoadingRuns(`Por ahora no hay ninguna run hispana en esta sección.`);
			}
			else {
				$("#loadingLeaderboard").html("<h5>Cargando el resto de runs, por favor espere...</h5>"+ $("#loadingLeaderboardText").html());
			}

			let title = `${$("#divGameTitle").html()}`;
			if(leaderboard.subcategories.length > 0) {
				title+= " - ";
				leaderboard.subcategories.forEach( (subcategory) => {
					title+= `${subcategory.label}, `;
				});
				title = title.substring(0, title.length - 2);
			}
			document.title = title;
			finished = true;
		})
		.fail(err => {
			finished = true;
			console.log('error al cargar la leaderboard');
			errorLoadingRuns('Error al cargar la leaderboard, culpa de Luizón.');
			console.log(err);
			console.log(leaderboard.category.ID)
			if(err.responseJSON) {
				if(err.responseJSON.message) {
					// alert(err.responseJSON.message);
					$("#loadingLeaderboardText").html($("#loadingLeaderboardText").html()
						+ "<br><br><h6 style='text-align: left;font-weight: normal;'>Respuesta de speedrun.com:"
						+ `<br>${err.responseJSON.message}</h6>`
					);
				}
			}
			else {
				let game = urlParams.get("juego");
				let category = leaderboard.category.name.replace(" ", "_").replace("%", "");
				let subcategory = "";
				if(leaderboard.subcategories.length > 0) {
					leaderboard.subcategories.forEach( (isubcategory) => {
						subcategory+= `${isubcategory.key}=${isubcategory.ID},`;
					});
					subcategory = subcategory.substring(0, subcategory.length - 1);
				}
				let newParams = `?juego=${game}&categoria=${category}`;
				if(subcategory)
					newParams+= `&subcategorias=${subcategory}`;
				if(urlParams.has("top"))
					newParams+= `&top=${urlParams.get("top") / 2}`;
				else
					newParams+= `&top=2000`;
					
				$("#loadingLeaderboardText").html($("#loadingLeaderboardText").html()
					+ "<br><br><h6 style='text-align: left;font-weight: normal;'>Prueba recargando la página."
					+ "<br>En ocasiones speedrun.com tarda demasiado en cargar y aparece este error.</h6>"
					+ `<br><br>Si el problema persiste <a href="../leaderboard/${newParams}" class="hyperlink dark">intenta cargar menos información en este link.</a>`
				);
			}
	});
};

// function encode64(gameId, categoryId) {
// 	// se asume que si hay subcaegoria, esto generara error en leaderboards sin subcategoria
// 	let variables = "";
// 	if(leaderboard.subcategory.key) {
// 		variables = `{"variableId":"${leaderboard.subcategory.key}","valueIds":["${leaderboard.subcategory.ID}"]}`;
// 		/*
// 			para multiples variables, usar un json separado por coma por cada una en este formato:
// 			{"variableId":"varId","valueIds":["valId"]},{"variableId":"varId","valueIds":["valId","val2Id"]},{"variableId":"varId","valueIds":["valId"]}
// 		*/
// 	}
// 	// let rawJson = `{"params":{"gameId":"${gameId}","categoryId":"${categoryId}","values":[${variables}],"emulator":1},"page":1,"vary":1686768609}`; // genera error
// 	let rawJson = `{"params":{"gameId":"${gameId}","categoryId":"${categoryId}","values":[${variables}],"timer":0,"regionIds":[],"platformIds":[],"emulator":1,"video":0,"obsolete":0},"page":1,"vary":1686768609}`;
	
// 	let output = btoa(rawJson);
// 	output = output.replace(/=/g, "");
// 	return output;
// }

// // carga runs con API v1 y carga runners con API v2
// async function createRunBars(json) {
// 	let apiV1URL = `${SPEEDRUN_API}/leaderboards/${json.game}/category/${json.category}`;
// 	let apiV2URL = `${SPEEDRUN_API_V2}/GetGameLeaderboard?_r=${encode64(json.game, json.category)}`;

// 	// console.log(apiV2URL);

// 	let salir = false;
	
// 	await loadPlayers(apiV2URL)
// 		.catch(err => {
// 			console.log(err);
// 			salir = true;
// 		});
// 	if(salir)
// 		return false;

// 	if(leaderboard.subcategory.key) { // subcategorias
// 		apiV1URL+= "?var-";
// 		apiV1URL+= `${leaderboard.subcategory.key}=${leaderboard.subcategory.ID}`;
// 	}
// 	if(urlParams.has("top")) {
// 		await loadRuns(apiV1URL, urlParams.get("top"))
// 			.catch(err => { // limite puesto por usuario
// 				console.log(err);
// 				salir = true;
// 			});
// 		if(salir)
// 			return false;
// 	}
// 	else {
// 		await loadRuns(apiV1URL, DEFAULT_LIMIT)
// 			.catch(err => { // limite por defecto
// 				console.log(err);
// 				salir = true;
// 			});
// 		if(salir)
// 			return false;
// 		runsArray.forEach((runner, i) => {
// 			new RunBar(runner);
// 		});
// 		if(DEFAULT_LIMIT < playersArray.length) {
// 			$("#loadingLeaderboardText").html("Se está cargando el resto de posiciones. Por favor espere.");
// 		}
// 		await loadRuns(apiV1URL)
// 			.catch(err => { // carga todas las runs
// 				console.log(err);
// 				salir = true;
// 			});
// 		if(salir)
// 			return false;
// 	}
// 	runsArray.forEach((runner, i) => {
// 		// si son menos runs que DEFAULT_LIMIT, aqui no va a entrar a menos que se haya puesto un tope desde url
// 		new RunBar(runner);
// 	});

// 	// if(runsArray.length > 0)
// 	if($("#obj2")[0] != undefined) // obj2 es el primer puesto en la leaderboard. obj1 es el encabezado de la tabla
// 		runsDiv.removeChild(runsDivLoading);
// 	else {
// 		errorLoadingRuns(`Por ahora no hay ninguna run hispana en esta sección.`);
// 	}


// 	document.title = `${$("#divGameTitle").html()} - ${leaderboard.subcategory.label}`;
// }

// async function loadRuns(apiURL, limite = false) {
// 	if(limite) {
// 		if(apiURL.includes("?"))
// 			apiURL+= "&";
// 		else
// 			apiURL+= "?";
// 		apiURL+=`top=${limite}`;
// 	}
// 	await $.get(apiURL)
// 		.done(apiAnswer => {
// 			// console.log(apiAnswer)
// 			let runs = apiAnswer.data.runs;
// 			runsArray = [];
// 			runs.forEach(async (run, i) => {
// 				if(!urlParams.has("top") && !limite)
// 					if(i < DEFAULT_LIMIT)
// 						return false;
// 				if(!playersArray[i]) // ni idea porque esto pasaria, pero parece que pasa 2 veces
// 					return false;
// 				if(!playersArray[i].areaId) // se salta jugadores sin pais definido
// 					return false;
// 				if(!Object.keys(HISPANIC_AREA_ID).includes(playersArray[i].areaId)) // se salta jugadores cuyo pais no este definido
// 					return false;
				
// 				let variables = "";
// 				for(let iVariable in run.run.values)
// 					if(leaderboard.variables[iVariable])
// 						variables+= `${leaderboard.variables[iVariable][run.run.values[iVariable]]}, `;
// 				if(variables)
// 					variables = variables.substring(0, variables.length - 2); // quita el ", " del final

// 				runsArray.push({
// 					hPosition : hPosition++,
// 					globalPosition : run.place,
// 					countryCode : playersArray[i].areaId,
// 					country : HISPANIC_AREA_ID[playersArray[i].areaId],
// 					// player : run.run.players[0].id,
// 					player : playersArray[i].name,
// 					url : run.run.weblink,
// 					comment : run.run.comment,
// 					time : formatTime(run.run.times.primary_t),
// 					date : run.run.date,
// 					parentNode: runsDiv,
// 					subcategory : variables || leaderboard.subcategory.label || '',
// 					class_ : `row-${hPosition % 2 > 0 ? 'odd' : 'even'}`,
// 				});
// 			});

// 			finished = true;
// 		})
// 		.fail(err => {
// 			finished = true;
// 			console.log('error al cargar la leaderboard');
// 			errorLoadingRuns('Error al cargar la leaderboard, culpa de Luizón.');
// 			console.log(err);
// 			console.log(leaderboard.category.ID)
// 			if(err.responseJSON) {
// 				if(err.responseJSON.message) {
// 					// alert(err.responseJSON.message);
// 					$("#loadingLeaderboardText").html($("#loadingLeaderboardText").html()
// 						+ "<br><br><h6 style='text-align: left;font-weight: normal;'>Respuesta de speedrun.com:"
// 						+ `<br>${err.responseJSON.message}</h6>`
// 					);
// 				}
// 			}
// 			else {
// 				let game = urlParams.get("juego");
// 				let category = leaderboard.category.name.replace(" ", "_").replace("%", "");
// 				let subcategory = leaderboard.subcategory.label || null;
// 				let newParams = `?juego=${game}&categoria=${category}`;
// 				if(subcategory)
// 					newParams+= `&subcategoria=${subcategory.replace(" ", "_").replace("%", "")}`;
// 				if(urlParams.has("top"))
// 					newParams+= `&top=${urlParams.get("top") / 2}`;
// 				else
// 					newParams+= `&top=2000`;
					
// 				$("#loadingLeaderboardText").html($("#loadingLeaderboardText").html()
// 					+ "<br><br><h6 style='text-align: left;font-weight: normal;'>Prueba recargando la página."
// 					+ "<br>En ocasiones speedrun.com tarda demasiado en cargar y aparece este error.</h6>"
// 					+ `<br><br>Si el problema persiste <a href="../leaderboard/${newParams}" class="hyperlink dark">intenta cargar menos información en este link.</a>`
// 				);
// 			}
// 		});
// }

// async function loadPlayers(apiURLV2) {
// 	console.log(apiURLV2);
// 	await $.get(apiURLV2)
// 		.done(apiAnswer => {
// 			console.log('buena po')
// 			apiAnswer.leaderboard.players.forEach(player => {
// 				playersArray.push({
// 					areaId : player.areaId,
// 					name: player.name
// 				});
// 			});
// 		})
// 		.fail(err => {
// 			finished = true;
// 			console.log('error al cargar a los runners');
// 			console.log(err);
// 			bootbox.alert({
// 				title: 'Error',
// 				message: 'No se cargaron los runners de forma correcta.'
// 				+ '<br>Culpa de Luizón.',
// 				buttons: {
// 					ok: {
// 						label: 'Aceptar',
// 					},
// 				},
// 			});

// 			errorLoadingRuns("Error al cargar a los runners.");
// 			$("#loadingLeaderboardText").html($("#loadingLeaderboardText").html()
// 				+ "<br><br><h2 style='text-align: left;font-weight: normal;'>ggshermano.</h2>"
// 				+ `<br><br><h6>Se está trabajando en solucionar este error para que no se repita.`
// 				+ `<br>Intenta recargar la página, a veces funciona.</h6>`
// 			);
// 		});
// }

window.onload = async function() {
	if(!urlParams.has('juego'))
		window.location.href = "../";
	startedAt = new Date();
	luizonShouldOptimizeThisWebPage();
	if(urlParams.get("juego").toLowerCase() == 'sm64') {
		$("#divDiscord")[0].href = "https://discord.gg/2Vx5DeJvQP";
		$("#divDiscord")[0].title = "Comunidad Ñ del Mario 64";
	}
	else if(urlParams.get("juego").toLowerCase() == 'smo') {
		$("#divDiscord")[0].href = "https://discord.gg/HkRAgg7cNy";
		$("#divDiscord")[0].title = "Gruta del runner";
	}
	// else
	// 	$("#divMensajeTope").html("Esta página ha sido pensada para Mario Odyssey y Mario 64."
	// 		+ "<br>Puedes usarla para ver runners hispanos de otros juegos, pero ten en cuenta que el discord que saldrá será el angloparlante y que podría haber algún problema no previsto con las subcategorías."
	// 	);

	let salir = false;

	document.title = `${urlParams.get('juego')} | Cargando informacion`;
	runsDiv = document.getElementById("divRunBars");
	runsDivLoading = document.getElementById("divRunBarsLoading");
	await loadCategories({ game : urlParams.get('juego') }) // carga categorias y titulo del juego
		.catch( err=> {
			console.log(err);
			salir = true;
		});
	if(salir)
		return false;
	await loadSubcategories( leaderboard.category.ID ) // carga subcategorias
		.catch( err=> {
			console.log(err);
			salir = true;
		});
	if(salir)
		return false;

	createRunBars({ // carga la leaderboard como tal
		game : leaderboard.game.ID,
		category : leaderboard.category.ID
	});
}