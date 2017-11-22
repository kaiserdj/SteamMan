exports.config = {
	//--------------------------
	//Datos de la cuenta
	//--------------------------
	
	username: 'example',
	password: '12345',
	sharedSecret: '+Ivaabcacbabacabca=',
	idSecret: 'abcabcacb/abc/abcdQ=',
	apikey: '123456adfadf41231313', //http://steamcommunity.com/dev/apikey Crear un si no lo teneis creado, nombre del dominio: localhost
	owner: '78131655645555',//Id del la cuenta de steam del dueño, para más ayuda use: https://steamid.io/ , el correcto es el steamID64
	language : 'es', //Idioma del bot
	
	//--------------------------
	//Funcino Pastebin
	//--------------------------
	
	pastebin_defecto: '1', // 0-Funciones con Pasterbin deshabilitadas 1-Funciones con Pasterbin habilitadas
	pastebin_api_dev_key: 'ab5166516161561121231615', //Key de api Pastebin -> https://pastebin.com/api
	pastebin_api_user_name: 'example', //Usuario de Pastebin
	pastebin_api_user_password: '123456123', //Contraseña de Pastebin
	
	//--------------------------
	//Funcino idlear juegos
	//--------------------------
	
	idle_defecto: '1', // 0-No idlear juego  1-Idlear juego
	idle_juego: 730, // 730->CSGO 440->TF2
	
	//--------------------------
	//Funcino detectar ofertas
	//--------------------------
	
	detect_offer: '1', // 0-No detectar ofertas recividas  1-Detectar ofertas recividas
	decline_offer_nodonate: '1', // 0-No declinar ofertas recividas que no sean donaciones  1-Declinar ofertas recividas que no sean donaciones
	auto_send_Owner: '1' // 0-No autoenviar items recividos al owner  1-Autoenviar items recividos al owner
};