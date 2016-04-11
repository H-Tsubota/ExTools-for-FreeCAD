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

var createFCParamGroup = function(dom, name){
	var newNode = dom.createNode(1, 'FCParamGroup', '');
	var attribute = dom.createNode(2, 'Name', '');
	attribute.text = name;
	newNode.attributes.setNamedItem(attribute);
	return newNode;
};

var createFCText = function(dom, name, text){
	var newNode = dom.createNode(1, 'FCText', '');
	var attribute = dom.createNode(2, 'Name', '');
	attribute.text = name;
	newNode.attributes.setNamedItem(attribute);
	newNode.text = text;
	return newNode;
};

var createFCBool = function(dom, name, value){
	var newNode = dom.createNode(1, 'FCBool', '');
	var nameAttribute = dom.createNode(2, 'Name', '');
	nameAttribute.text = name;
	newNode.attributes.setNamedItem(nameAttribute);
	var valueAttribute = dom.createNode(2, 'Value', '');
	valueAttribute.text = value;
	newNode.attributes.setNamedItem(valueAttribute);	
	return newNode;
};

var saveDomWithIndent = function(dom, filename) {
	var writer =  new ActiveXObject("MSXML2.MXXMLWriter");
        var reader = new ActiveXObject("MSXML2.SAXXMLReader");
        var fso = new ActiveXObject("Scripting.FileSystemObject");
        textStream = fso.CreateTextFile(filename, true);
	writer.indent = true;
	reader.contentHandler = writer;
	reader.parse(dom);
	textStream.Write(writer.output);
	textStream.Close();
};

var registerMacro = function (title, iconPath, macro){
	var shell = new ActiveXObject("WScript.Shell");
	var appData=shell.ExpandEnvironmentStrings("%APPDATA%")
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
	if(typeof macroPathNode === 'undefined'){
		// If not exists , create macro path.
		var macroNode = getNode(root, 'Root/BaseApp/Preferences/Macro');
		macroNode.appendChild(createFCText(dom, 'MacroPath', macroPath));
	}

	// Register macro icon path for ExTools
	var bitmapsNode = getNode(root, 'Root/BaseApp/Preferences/Bitmaps');
	var existPath = false;
	var paths = bitmapsNode.childNodes;
	for (var i =0; i<paths.length; i++){
		if(paths[i].text ==  iconPath){
			existPath = true;
			break;
		}
	}
	if(!existPath){
		var i = paths.length;
		bitmapsNode.appendChild(createFCText(dom, 'CustomPath' + i, iconPath));
	}

	var alreadyRegistered = false;
	var macros = getNode(root, 'Root/BaseApp/Macro/Macros');
	for (var i =0; i<macros.childNodes.length; i++){
		var script = getNode(macros.childNodes[i], 'Script');
		if(script.text == macro.Script){
			alreadyRegistered = true;
			break;
		}
	}
	
	if(!alreadyRegistered){
		// Register Macro
		var macroName = 'Std_Macro_' + macros.childNodes.length;
		var newMacro = createFCParamGroup(dom, macroName);
		newMacro.appendChild(createFCText(dom, 'Script', macro.Script));
		newMacro.appendChild(createFCText(dom, 'Menu', macro.Menu));
		newMacro.appendChild(createFCText(dom, 'Tooltip', macro.Tooltip));
		newMacro.appendChild(createFCText(dom, 'WhatsThis', macro.WhatsThis));
		newMacro.appendChild(createFCText(dom, 'Statustip', macro.Statustip));
		newMacro.appendChild(createFCText(dom, 'Pixmap', macro.Pixmap));
		newMacro.appendChild(createFCText(dom, 'Accel', macro.Accel));
		macros.appendChild(newMacro);

		// Register to Workbench
		var destWorkbench = getNode(root, 'Root/BaseApp/Workbench/Global');
		if(typeof destWorkbench === 'undefined'){
			destWorkbench = createFCParamGroup(dom, 'Global');
			var workbench = getNode(root, 'Root/BaseApp/Workbench');
			workbench.appendChild(destWorkbench);
		}
		var destToolbar = getNode(root, 'Root/BaseApp/Workbench/Global/Toolbar');
		if(typeof destToolbar === 'undefined'){
			destToolbar = createFCParamGroup(dom, 'Toolbar');
			destWorkbench.appendChild(destToolbar);
		}
		var existToolbar = false;
		var customs = destToolbar.childNodes;
		for (var i =0; i<customs.length; i++){
			var name = getNode(customs[i], 'Name');
			if(name.text == title){
				existToolbar = true;
				customs[i].appendChild(createFCText(dom, macroName, 'FreeCAD'));
				break;
			}
		}
		if(!existToolbar){
			var custom1 = createFCParamGroup(dom, 'Custom_' + (customs.length + 1));
			custom1.appendChild(createFCText(dom, 'Name', title));
			custom1.appendChild(createFCBool(dom, 'Active', '1'));
			custom1.appendChild(createFCText(dom, macroName, 'FreeCAD'));
			destToolbar.appendChild(custom1);
		}
	}

	// Register to MainWindow
	var mainWindowToolbar = getNode(root, 'Root/BaseApp/MainWindow/Toolbars');
	if(typeof mainWindowToolbar === 'undefined'){
		mainWindowToolbar = createFCParamGroup(dom, 'PartDesignWorkbench');
		var mainWindows = getNode(root, 'Root/BaseApp/MainWindow');
		mainWindows.appendChild(mainWindowToolbar);
	}
	var mainWindowToolbarTools = getNode(root, 'Root/BaseApp/MainWindow/Toolbars/' + title);
	if(typeof mainWindowToolbarTools === 'undefined'){
		mainWindowToolbar.appendChild(createFCBool(dom, title, '1'));
	}
	
	dom.save(freeCADHome + "\\user.cfg");
	return macroPath;
};

(function (){
	var fso = new ActiveXObject("Scripting.FileSystemObject");
	var scriptDir = fso.getParentFolderName(WScript.ScriptFullName);
	
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
		Statustip : 'Type your function and click "Add".',
		Pixmap : 'FunctionPolyline',
		Accel : 'Alt+P'
	};
	var macroPath = registerMacro(title, iconPath, macroFunctionPolyline);
	if(typeof macroPath === 'undefined'){
		return;
	}
	var macroShapeInformation = {
		Script : 'ShapeInformation.FCMacro',
		Menu : 'Shape Information...',
		Tooltip : 'Show volume, area and center of mass.',
		WhatsThis : 'Show volume, area and center of mass.',
		Statustip : 'Select objects and run this tool.',
		Pixmap : 'ShapeInformation',
		Accel : 'Alt+I'
	};
	var macroPath = registerMacro(title, iconPath, macroShapeInformation);
	if(typeof macroPath === 'undefined'){
		return;
	}

	// Copy macro
	var fso = new ActiveXObject("Scripting.FileSystemObject");
	fso.CopyFile(scriptDir + "\\macros\\FunctionPolyline.FCMacro", macroPath);
	fso.CopyFile(scriptDir + "\\macros\\ShapeInformation.FCMacro", macroPath);
	fso.CopyFile(scriptDir + "\\uninstall.js", freeCADHome + "\\uninstall-" + title + ".js");
	
	// Copy icon
	if(!fso.FolderExists(iconPath)){
		fso.CreateFolder(iconPath);
	}
	fso.CopyFile(scriptDir + "\\icons\\FunctionPolyline.svg", iconPath + "\\");
	fso.CopyFile(scriptDir + "\\icons\\ShapeInformation.svg", iconPath + "\\");

	WScript.Echo('done.');
})();
