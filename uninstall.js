var getNode = function(node, fcPath, level){
	if(typeof level === 'undefined') {
		level = 0;
	}
	var words = fcPath.split('/');
	if(words.length <= level){
		return node;
	}
	
	var ret = undefined;
	var children = node.childNodes;
	for (var i = 0; i < children.length; i++){
		if(typeof children[i].getAttribute=== 'undefined'){
			continue;
		}
		if(words[level] == children[i].getAttribute("Name")){
			ret = getNode(children[i], fcPath, level+1);
		}
	}
	
	return ret;
};

var unregisterMacro = function (title, iconPath, macro){
	var shell = new ActiveXObject("WScript.Shell");
	var freeCADHome=shell.ExpandEnvironmentStrings("%APPDATA%") + '\\FreeCAD';
	
	var dom = new ActiveXObject("Msxml2.DOMDocument.6.0");
	var doc = dom.load(freeCADHome + "\\user.cfg");
	if (dom.parseError.errorCode != 0) {
		WScript.Echo("parseError:" + "\n" + dom.parseError.errorCode + "\n" + dom.parseError.reason);
		return;
	}

	var root = dom.documentElement;
	
	// Gets macro path
	var macroPathNode = getNode(root, 'Root/BaseApp/Preferences/Macro/MacroPath');
	var macroPath = (typeof macroPathNode === 'undefined') ? (freeCADHome + '\\') : macroPathNode.text;

	// Unregister macro icon path for ExTools
	var bitmapsNode = getNode(root, 'Root/BaseApp/Preferences/Bitmaps');
	var deleting = [];
	var paths = bitmapsNode.childNodes;
	for (var i =0; i<paths.length; i++){
		if(paths[i].text ==  iconPath){
			deleting.push(i);
		}
	}
	for (var i=deleting.length-1; 0<=i; i--) {
		bitmapsNode.removeChild(bitmapsNode.childNodes[deleting[i]]);
	}

	// Unregister Macro
	var macrosNode = getNode(root, 'Root/BaseApp/Macro/Macros');
	var deleting = [];
	var macros = macrosNode.childNodes;
	for (var i =0; i<macros.length; i++){
		var script = getNode(macros[i], 'Script');
		if(script.text == macro.Script){
			deleting.push(i);
		}
	}
	for (var i=deleting.length-1; 0<=i; i--) {
		macrosNode.removeChild(macrosNode.childNodes[deleting[i]]);
	}
	
	// Unregister to Workbench
	var destWorkbench = getNode(root, 'Root/BaseApp/Workbench/Global');
	if(typeof destWorkbench != 'undefined'){
		var destToolbar = getNode(root, 'Root/BaseApp/Workbench/Global/Toolbar');
		if(typeof destToolbar != 'undefined'){	
			var customs = destToolbar.childNodes;
			var deleting = [];
			for (var i =0; i<customs.length; i++){
				var name = getNode(customs[i], 'Name');
				if(name.text == title){
					deleting.push(i);
				}
			}
			for (var i=deleting.length-1; 0<=i; i--) {
				destToolbar.removeChild(destToolbar.childNodes[deleting[i]]);
			}		
		}
	}

	// Unregister to MainWindow
	var mainWindowToolbar = getNode(root, 'Root/BaseApp/MainWindow/Toolbars');
	if(typeof mainWindowToolbar != 'undefined'){
		var mainWindowToolbarTools = getNode(root, 'Root/BaseApp/MainWindow/Toolbars/' + title);
		if(typeof mainWindowToolbarTools != 'undefined'){
			mainWindowToolbar.removeChild(mainWindowToolbarTools);
		}
	}

	dom.save(freeCADHome + "\\user.cfg");
	return macroPath;
};

(function (){
	var shell = new ActiveXObject("WScript.Shell");
	var freeCADHome=shell.ExpandEnvironmentStrings("%APPDATA%") + '\\FreeCAD';
	
	// register macro
	var title = 'ExTools';
	var iconPath = freeCADHome + '\\ExTools';
	var macroFunctionPolyline = {
		Script : 'FunctionPolyline.FCMacro',
		Menu : 'Function Polyline...',
		Tooltip : 'Draw polyline with function.',
		WhatsThis : 'Draw polyline with function.',
		Statustip : 'Type your function and click "Add"',
		Pixmap : 'FunctionPolyline',
		Accel : 'Alt+F'
	};
	var macroPath = unregisterMacro(title, iconPath, macroFunctionPolyline);
	if(typeof macroPath === 'undefined'){
		return;
	}
	var macroFunctionPolyline = {
		Script : 'ShapeInformation.FCMacro',
		Menu : 'Shape Information...',
		Tooltip : 'Show volume, area and center of mass.',
		WhatsThis : 'Show volume, area and center of mass.',
		Statustip : '',
		Pixmap : 'ShapeInformation',
		Accel : 'Alt+I'
	};
	var macroPath = unregisterMacro(title, iconPath, macroFunctionPolyline);
	if(typeof macroPath === 'undefined'){
		return;
	}

	// Delete macro
	var fso = new ActiveXObject("Scripting.FileSystemObject");
	if(fso.FileExists(freeCADHome + "\\FunctionPolyline.FCMacro")){
		fso.DeleteFile(freeCADHome + "\\FunctionPolyline.FCMacro", true);
	}
	if(fso.FileExists(freeCADHome + "\\ShapeInformation.FCMacro")){
		fso.DeleteFile(freeCADHome + "\\ShapeInformation.FCMacro", true);
	}
	
	// Delete icon
	if(fso.FolderExists(iconPath)){
		fso.DeleteFolder (iconPath, true);
	}

	WScript.Echo('done.');
})();
