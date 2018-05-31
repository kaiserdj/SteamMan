// Modulos de nodejs
var SteamCommunity = require('steamcommunity');
var SteamUser = require('steam-user');
var SteamTotp = require("steam-totp");
var TradeOfferManager = require('steam-tradeoffer-manager');
var SteamRepAPI = require('steamrep'); //Api de SteamRep
var log4js = require('log4js'); //Modulo para registros en la consola
var fs = require('fs'); //Modulo de manejo de ficheros
var colors = require('colors'); //Colores en consola
var PastebinAPI = require('pastebin-js'); //Modulo API de Pastebin

//Fichero de datos requeridos
var config = require('./config.js').config;

//"Variables de entorno"
var client = new SteamUser();
var community = new SteamCommunity();
var detect_offer = config.detect_offer; //Variable de la opción detectar ofertas
var decline_offer_nodonate = decline_offer_nodonate; //Variable de la opción declinar ofertas
var idle_defecto = config.idle_defecto; //Variable de la opción idlear juego
var pastebin_defecto = config.pastebin_defecto; //Variable de la opción de funciones con Pasterbin.
var language = config.language; //Variable idioma del bot

//Idioma del bot
var lang = require('./translations/' + language + '.js').lang;

//Configuración para el log
log4js.configure({
  appenders: {
    reg: {
      type: 'file',
      filename: 'reg.log',
      maxLogSize: 10000000
    }
  },
  categories: {
    default: {
      appenders: ['reg'],
      level: 'all'
    }
  }
});
var applog = log4js.getLogger('reg');
// Tipos de log -> TRACE - DEBUG - INFO - WARN - ERROR - FATAL

//Configurar log y colores en consola
colors.setTheme({
  trace: 'blue',
  debug: 'cyan',
  info: 'green',
  warn: 'yellow',
  error: 'red',
  fatal: 'magenta'
});

//Guardado en el log los ajustes de arranque del bot
console.log(lang.savelog.info);
applog.info(lang.savelog);
applog.info(lang.username + config.username);
applog.info(lang.owner + config.owner);
applog.info(lang.idle_defect + config.idle_defecto);
applog.info(lang.idle_game + config.idle_juego);
applog.info(lang.detect_offer + config.detect_offer);
applog.info(lang.offer_decline + config.decline_offer_nodonate);
applog.info(lang.autosend_offer_owner + config.auto_send_Owner);

//Configuración modulo Pastebin
if (pastebin_defecto === "1") {
  pastebin = new PastebinAPI({
    'api_dev_key': config.pastebin_api_dev_key,
    'api_user_name': config.pastebin_api_user_name,
    'api_user_password': config.pastebin_api_user_password
  });
}

//Medir latencia en el server
SteamTotp.getTimeOffset(function(offset, latency) {
  latenncy = Math.floor(latency / 1000);
  if (latency > 1) {
    applog.warn(lang.latency_server);
    console.log(lang.latency_server.warn);
    serverOffset = offset + Math.floor(latency / 2);
  } else {
    serverOffset = offset;
  }
});

var manager = new TradeOfferManager({
  steam: client,
  community: community,
  domain: config.apikey,
  language: "en",
  pollInterval: "30000"
});

//Variable de inicio de sesión
var logOnOptions = {
  accountName: config.username, //Usuario
  password: config.password, //Contraseña
  twoFactorCode: SteamTotp.generateAuthCode(config.sharedSecret) //El codigo sharedSecret
};

//Inicio de sesión
//Inicio de steam-user
client.logOn(logOnOptions);

client.on('loggedOn', () => {
  client.setPersona(SteamUser.EPersonaState.Online); //Poner cuenta en modo conectado
  client.setUIMode(SteamUser.EClientUIMode.BigPicture); //Poner cuenta en modo Big Picture
});

//Cookies de steam-user y steamcommunity
client.on('webSession', (sessionid, cookies, err) => {
  community.setCookies(cookies);
  if (err) {
    applog.fatal(lang.error_cookies_community + err.message);
    console.log(lang.error_cookies_community.fatal + err.message);
    process.exit(1); //Cerrar programa
  } else {
    applog.info(lang.session_started + client.steamID.getSteamID64());
    console.log(lang.session_started.info + client.steamID.getSteamID64());
    community.chatLogon();
    manager.setCookies(cookies, function(err) {
      if (err) {
        applog.fatal(lang.error_cookies_TradeOfferManager + err);
        console.log(lang.error_cookies_TradeOfferManager.fatal + err);
        process.exit(1);
      }
    });
  }
  community.chatLogon();
  //Idlear juego por defecto
  if (idle_defecto === "1") {
    var gameid = config.idle_juego;
    client.gamesPlayed(gameid);
    applog.info(lang.idleinfo_defect_1 + gameid + lang.idleinfo_defect_2);
    console.log(lang.idleinfo_defect_1.info + gameid + lang.idleinfo_defect_2.info);
  }
  //Comprobar si hay ofertas nueva
  if (detect_offer === "1") {
    community.startConfirmationChecker(10000, config.idSecret);
    console.log("  ");
    applog.info(lang.wait_offer_1);
    console.log(lang.wait_offer_2);
    console.log("  ");
  } else {
    community.stopConfirmationChecker();
    applog.info(lang.no_wait_offer);
    console.log(lang.no_wait_offer);
    console.log("  ");
  }
});

//Nueva oferta
if (detect_offer === "1") {
  manager.on('newOffer', processTrade);

  function processTrade(offer) {
    if (offer.partner.getSteamID64() === config.owner) {
      applog.trace(lang.new_offer_owner + offer.id);
      console.log(lang.new_offer_owner.trace + offer.id)
    } else {
      applog.trace(lang.new_offer_1 + offer.id + lang.new_offer_2 + offer.partner);
      console.log(lang.new_offer_1.trace + offer.id + lang.new_offer_2.trace + offer.partner);
    }
    var toGet = offer.itemsToReceive;
    var toGive = offer.itemsToGive;
    //console.log("Vairable toGive: ".trace + toGive);
    //console.log("Vairable toGet: ".trace + toGet);
    /*console.log(
    	JSON.stringify(toGet)
    );
    var prueba = JSON.stringify(toGet);
    var prueba2 = JSON.stringify(toGet, [""]);
    fs.writeFile("test.txt",prueba, function(err) {
    	if(err) {
    		return console.log(err);
    	}

    	console.log("The file was saved!");
    }); */
    if (toGive.length == 0 || offer.partner.getSteamID64() === config.owner) { //Aceptar ofertas en las que se tenga que dar nada o sea una oferta hecha po el dueño
      offer.accept(function(err) {
        if (err) {
          if (offer.partner.getSteamID64() === config.owner) {
            applog.error(lang.error_accept_offer_owner + offer.id);
            console.log(lang.error_accept_offer_owner.error + offer.id);
          } else {
            applog.error(lang.error_accept_donation_1 + offer.id + lang.error_accept_donation_2 + offer.partner.getSteamID64());
            console.log(lang.error_accept_donation_1.error + offer.id + lang.error_accept_donation_2.error + offer.partner.getSteamID64());
          }
        } else {
          if (offer.partner.getSteamID64() === config.owner) {
            applog.info(lang.accept_offer_owner + offer.id);
            console.log(lang.accept_offer_owner.info + offer.id);
            /*//Probando función: Enviar objetos recividos al Owner del bot
            if(config.auto_send_Owner === "1") {
            	var offer = manager.createOffer(config.owner);
            	offer.addMyItem(toGet);
            	offer.send("Items recividos de " + offer.partner.getSteamID64() +" en el trade #" + offer.id, "KYworVTM", function(err, status) {
            		if (err) {
            			console.log(err);
            		} else {
            			console.log("Enviada oferta al Owner #" + offer.id + " " + status);
            		}
            	});
            	console.log(offer);
            	offer.accept(function (err) {
            		if (err) {
            			console.log("No se puede aceptar la oferta #"+ offer.id +": " + err.message);
            		} else {
            			console.log("Oferta aceptada.");
            		}
            	});
            }*/
          } else {
            applog.info(lang.accept_donation_1 + offer.id + lang.accept_donation_2 + offer.partner.getSteamID64());
            console.log(lang.accept_donation_1.info + offer.id + lang.accept_donation_2.info + offer.partner.getSteamID64());
            /*//Enviar objetos recividos al Owner del bot
            if(config.auto_send_Owner === "1") {
            	var offer = manager.createOffer(config.owner);
            	offer.addMyItem(toGet);
            	offer.send("Items recividos de " + offer.partner.getSteamID64() +" en el trade #" + offer.id, "KYworVTM", function(err, status) {
            		if (err) {
            			console.log(err);
            		} else {
            			console.log("Enviada oferta al Owner #" + offer.id + " " + status);
            		}
            	});
            	console.log(offer);
            	offer.accept(function (err) {
            		if (err) {
            			console.log("No se puede aceptar la oferta #"+ offer.id +": " + err.message);
            		} else {
            			console.log("Oferta aceptada.");
            		}
            	});
            }*/
          }
        }
      });
    } else {
      if (decline_offer_nodonate === "1") {
        offer.decline(function(err) {
          if (err) {
            applog.error(lang.error_decline_offer_no_donation_1 + offer.id + lang.error_decline_offer_no_donation_2 + err.message);
            console.log(lang.error_decline_offer_no_donation_1.error + offer.id + lang.error_decline_offer_no_donation_2.error + err.message);
          } else {
            applog.info(lang.decline_offer_no_donation_1 + offer.id + lang.decline_offer_no_donation_2 + offer.partner.getSteamID64());
            console.log(lang.decline_offer_no_donation_1.info + offer.id + lang.decline_offer_no_donation_2.info + offer.partner.getSteamID64());
          }
        });
      } else {
        applog.info(lang.no_action_offer_1 + offer.id + lang.no_action_offer_2 + offer.partner.getSteamID64());
        console.log(lang.no_action_offer_1.info + offer.id + lang.no_action_offer_2.info + offer.partner.getSteamID64());
      }
    }
  }
}
//Mensaje del Owner al bot
client.on('friendMessage#' + config.owner, function(steamID, message) {
  applog.trace(lang.message_owner + message);
  console.log(lang.message_owner.trace + message);
  if (message.substr(0, 1) === '!') {
    var command = message.split(' ')[0].substring(1).toLowerCase();
    switch (command) {
      case 'ayuda':
      case 'help':
        var ayudamsg = message.substr((7));
        if (ayudamsg === "") {
          client.chatMessage(steamID, lang.message_ayuda);
        } else {
          ayuda(ayudamsg, steamID);
        }
        break;
      case 'info':
        client.chatMessage(steamID, lang.message_info);
        break;
      case 'ping':
        client.chatMessage(steamID, lang.message_ping);
        break;
      case 'botidle':
        var gameid = message.substr((9));
        idleGame(gameid, steamID);
        break;
      case 'idle':
        var gameid = message.substr((6));
        idleGame(gameid, steamID);
        break;
      case 'stopidle':
      case 'idlestop':
      case 'botidlestop':
        stopIdle();
        client.chatMessage(steamID, lang.message_stopidle);
        break;
      case 'Steamguard':
      case '2fa':
        client.chatMessage(steamID, lang.message_steamguard_1 + SteamTotp.getAuthCode(config.sharedSecret, serverOffset));
        applog.info(lang.message_steamguard_1 + SteamTotp.getAuthCode(config.sharedSecret, serverOffset) + lang.message_steamguard_2);
        console.log(lang.message_steamguard_1.info + SteamTotp.getAuthCode(config.sharedSecret, serverOffset) + lang.message_steamguard_2.info);
        break;
      case 'rep':
        var id_rep = message.substr((5));
        id_check_rep(id_rep, steamID);
        break
      case 'repinfo':
        var id_rep = message.substr((9));
        id_check_repinfo(id_rep, steamID);
        break;
      default:
        client.chatMessage(steamID, lang.message_default);
    }
  } else {
    client.chatMessage(steamID, lang.message_unknown);
  }
});

//Funciones para el bot
//Comando ayuda
function ayuda(ayudamsg, steamID) {
  switch (ayudamsg) {
    case 'info':
      client.chatMessage(steamID, lang.help_info);
      break
    case 'ayuda':
      client.chatMessage(steamID, lang.help_ayuda);
      break
    case 'ping':
      client.chatMessage(steamID, lang.help_ping);
      break
    case 'botidle':
    case 'idle':
      client.chatMessage(steamID, lang.help_botidle);
      break;
    case 'stopidle':
    case 'idlestop':
    case 'botidlestop':
      client.chatMessage(steamID, lang.help_stopidle);
      break
    case 'Steamguard':
    case '2fa':
      client.chatMessage(steamID, lang.hepl_steamguard);
      break
    case 'rep':
      client.chatMessage(steamID, lang.help_rep);
      break;
    case 'repinfo':
      client.chatMessage(steamID, lang.help_repinfo);
      break;
    default:
      client.chatMessage(steamID, lang.help_default);
  }
}
//Idle games
//Idlear juego
function idleGame(gameid, steamID) {
  //Comprovación si el gameid es un numero
  if (isNaN(parseInt(gameid, 10))) {
    if (gameid === "CSGO") { // Si escribe CSGO empieza a Idlear el juego CSGO
      var gameid = 730;
      client.gamesPlayed(gameid);
      client.chatMessage(config.owner, lang.idle_default);
      applog.info(lang.idle_default_1);
      console.log(lang.idle_default_1.info + lang.idle_default_2);
      return;
    }
    client.gamesPlayed(gameid);
    client.chatMessage(steamID, lang.idle_game + gameid);
    applog.info(lang.idle_game + gameid);
    console.log(lang.idle_game.info + gameid);
    return;
  }
  gameid = parseInt(gameid, 10);
  client.gamesPlayed(gameid);
  client.chatMessage(steamID, lang.idle_game + gameid);
  applog.info(lang.idle_game + gameid);
  console.log(lang.idle_game.info + gameid);
}
//Parar Idleado
function stopIdle() {
  client.gamesPlayed();
  client.idling = null;
  applog.info(lang.stopidle);
  console.log(lang.stopidle.info);
}
//Checkear Rep en SteamRep de un Id de steam
function id_check_rep(id_rep, steamID) {
  //Comprovación si el id_rep es un numero
  if (isNaN(parseInt(id_rep, 10))) {
    client.chatMessage(steamID, lang.rep_error_1 + id_rep + lang.rep_error_2);
    applog.info(lang.rep_error_1 + id_rep + lang.rep_error_3);
    console.log(lang.rep_error_1.warn + id_rep + lang.rep_error_3.warn);
    return;
  }
  SteamRepAPI.isScammer(id_rep, function(error, result) {
    if (error) {
      console.log(error.error);
      applog.error(error);
    } else {
      if (result) {
        applog.info(lang.rep_scam_1 + id_rep + lang.rep_scam_2);
        console.log(lang.rep_scam_1.info + id_rep + lang.rep_scam_2.info);
        client.chatMessage(steamID, lang.rep_scam_1 + id_rep + lang.rep_scam_3);
      } else {
        applog.info(lang.rep_noscam_1 + id_rep + lang.rep_noscam_2);
        console.log(lang.rep_noscam_1.info + id_rep + lang.rep_noscam_2.info);
        client.chatMessage(steamID, lang.rep_noscam_1 + id_rep + lang.rep_noscam_2);
      }
    }
  });
}
//Checkear toda la información en SteamRep de un Id de steam
function id_check_repinfo(id_rep, steamID) {
  //Comprovación si el id_rep es un numero
  if (isNaN(parseInt(id_rep, 10))) {
    client.chatMessage(steamID, lang.repinfo_error_1 + id_rep + lang.repinfo_error_2);
    applog.info(lang.repinfo_error_1 + id_rep + lang.repinfo_error_3);
    console.log(lang.repinfo_error_1.warn + id_rep + lang.repinfo_error_3.warn);
    return;
  }
  SteamRepAPI.getProfile(id_rep, function(error, result) {
    if (error === null) {
      var info_rep_text = JSON.stringify(result, null, 2); //Trasformar resultado a texto
      pastebin //Crear Pastebin
        .createPaste({
          text: info_rep_text,
          title: lang.repinfo_title + id_rep,
          format: null,
          privacy: 1,
          expiration: 'N'
        })
        .then(function(data) {
          applog.info(lang.repinfo_post_done_1 + id_rep + lang.repinfo_post_done_2 + data);
          console.log(lang.repinfo_post_done_1.info + id_rep + lang.repinfo_post_done_2.info + data);
          client.chatMessage(steamID, lang.repinfo_post_done_3 + id_rep);
          client.chatMessage(steamID, data);
        })
        .fail(function(err) {
          console.log(lang.repinfo_post_error.error + err);
          applog.error(lang.repinfo_post_error + error);
        });
    } else {
      console.log(lang.repinfo_errorrep.error + error);
      applog.error(lang.repinfo_errorrep + error);
    }
  });
}
