# -*- coding: utf-8 -*- 

import xml.dom.minidom
import sys
import shutil
import os
import os.path

def getNode(node, fcPath, level=0):
	words = fcPath.split("/");
	if(len(words) <= level):
		return node

	ret = None
	children = node.childNodes
	for node in children:
		if node.nodeType != node.ELEMENT_NODE:
			continue
		if words[level] == node.getAttribute("Name"):
			ret = getNode(node, fcPath, level+1)		
	return ret

def createFCParamGroup(dom, name):
	newNode = dom.createElement("FCParamGroup")
	newNode.setAttribute("Name", name)
	return newNode
	
def createFCText(dom, name, text):
	newNode = dom.createElement("FCText")
	newNode.setAttribute("Name", name)
	textNode = dom.createTextNode(text)
	newNode.appendChild(textNode)
	return newNode

def createFCBool(dom, name, value):
	newNode = dom.createElement("FCBool")
	newNode.setAttribute("Name", name)
	newNode.setAttribute("Value", value)
	return newNode

def registerMacro(title, iconPath, macro):
	if os.name == "nt":
		freeCADHome = os.getenv('APPDATA') +"/FreeCAD"
	elif os.name == "posix":
		freeCADHome = os.path.expanduser("~") +"/.FreeCAD"
	
	dom = xml.dom.minidom.parse(freeCADHome + "/user.cfg")
	root = dom.documentElement
	
	# Gets macro path
	macroPath = ""
	macroPathNode = getNode(root, "Root/BaseApp/Preferences/Macro/MacroPath");
	if macroPathNode != None and macroPathNode.hasChildNodes() and (macroPathNode.childNodes[0].nodeType == macroPathNode.TEXT_NODE):
		macroPath = macroPathNode.childNodes[0].data
	else:	
		# If not exists , create macro path.
		macroPath = freeCADHome + "/"
		macroNode = getNode(root, "Root/BaseApp/Preferences/Macro")
		macroNode.appendChild(createFCText(dom, "MacroPath", macroPath))

	# Register macro icon path for ExTools
	bitmapsNode = getNode(root, "Root/BaseApp/Preferences/Bitmaps")
	existPath = False
	for path in bitmapsNode.childNodes:
		if path != None and path.hasChildNodes() and (path.childNodes[0].nodeType == path.TEXT_NODE):
			if path.childNodes[0].data == iconPath:
				existPath = True
				break
	if not existPath:
		i = len(bitmapsNode.childNodes)
		bitmapsNode.appendChild(createFCText(dom, "CustomPath" + str(i), iconPath))

	alreadyRegistered = False
	macros = getNode(root, "Root/BaseApp/Macro/Macros")
	for m in macros.childNodes:
		script = getNode(m, "Script")
		if script != None and script.hasChildNodes() and (script.childNodes[0].nodeType == script.TEXT_NODE):
			if script.childNodes[0].data == macro.Script:
				alreadyRegistered = True
				break

	if not alreadyRegistered:
		# Register Macro
		macroName = "Std_Macro_" + str(len(macros.childNodes))
		newMacro = createFCParamGroup(dom, macroName)
		newMacro.appendChild(createFCText(dom, "Script", macro.Script))
		newMacro.appendChild(createFCText(dom, "Menu", macro.Menu))
		newMacro.appendChild(createFCText(dom, "Tooltip", macro.Tooltip))
		newMacro.appendChild(createFCText(dom, "WhatsThis", macro.WhatsThis))
		newMacro.appendChild(createFCText(dom, "Statustip", macro.Statustip))
		newMacro.appendChild(createFCText(dom, "Pixmap", macro.Pixmap))
		newMacro.appendChild(createFCText(dom, "Accel", macro.Accel))
		macros.appendChild(newMacro)
		
		# Register to Workbench
		destWorkbench = getNode(root, "Root/BaseApp/Workbench/Global")
		if destWorkbench == None :
			destWorkbench = createFCParamGroup(dom, "Global")
			workbench = getNode(root, "Root/BaseApp/Workbench")
			workbench.appendChild(destWorkbench)
		destToolbar = getNode(root, "Root/BaseApp/Workbench/Global/Toolbar")
		if destToolbar == None:
			destToolbar = createFCParamGroup(dom, "Toolbar")
			destWorkbench.appendChild(destToolbar)
		existToolbar = False
		for custom in destToolbar.childNodes:
			name = getNode(custom, "Name")
			if name != None and name.hasChildNodes() and (name.childNodes[0].nodeType == name.TEXT_NODE):
				if name.childNodes[0].data == title:
					existToolbar = True
					custom.appendChild(createFCText(dom, macroName, "FreeCAD"))
					break
		if not existToolbar:
			custom1 = createFCParamGroup(dom, "Custom_" + str(len(destToolbar.childNodes) + 1))
			custom1.appendChild(createFCText(dom, "Name", title))
			custom1.appendChild(createFCBool(dom, "Active", "1"))
			custom1.appendChild(createFCText(dom, macroName, "FreeCAD"))
			destToolbar.appendChild(custom1)
			
	# Register to MainWindow
	mainWindowToolbar = getNode(root, "Root/BaseApp/MainWindow/Toolbars")
	if mainWindowToolbar == None:
		mainWindowToolbar = createFCParamGroup(dom, "PartDesignWorkbench")
		mainWindows = getNode(root, "Root/BaseApp/MainWindow")
		mainWindows.appendChild(mainWindowToolbar)
	mainWindowToolbarTools = getNode(root, "Root/BaseApp/MainWindow/Toolbars/" + title)
	if mainWindowToolbarTools == None:
		mainWindowToolbar.appendChild(createFCBool(dom, title, '1'))
	
	dom.writexml(open(freeCADHome + "/user.cfg","w"))
	return macroPath

def install():
	scriptDir = os.path.dirname(os.path.realpath(__file__))
	if os.name == "nt":
		freeCADHome = os.getenv('APPDATA') +"/FreeCAD"
	elif os.name == "posix":
		freeCADHome = os.path.expanduser("~") +"/.FreeCAD"
	
	class Macro:
		def __init__(self):
			self.Script = ""
			self.Menu = ""
			self.Tooltip = ""
			self.WhatsThis = ""
			self.Statustip = ""
			self.Pixmap = ""
			self.Accel = ""

	title = 'ExTools'
	iconPath = freeCADHome + "/ExTools"
	
	macroFunctionPolyline = Macro()
	macroFunctionPolyline.Script = "FunctionPolyline.FCMacro"
	macroFunctionPolyline.Menu = "Function Polyline..."
	macroFunctionPolyline.Tooltip = "Draw polyline with function."
	macroFunctionPolyline.WhatsThis = "Draw polyline with function."
	macroFunctionPolyline.Statustip = 'Type your function and click "Add".'
	macroFunctionPolyline.Pixmap = "FunctionPolyline"
	macroFunctionPolyline.Accel = "Alt+P"
	macroPath = registerMacro(title, iconPath, macroFunctionPolyline)
	if macroPath == None:
		sys.exit()
	
	macroShapeInformation = Macro()
	macroShapeInformation.Script = "ShapeInformation.FCMacro"
	macroShapeInformation.Menu = "Shape Information..."
	macroShapeInformation.Tooltip = "Show volume, area and center of mass."
	macroShapeInformation.WhatsThis = "Show volume, area and center of mass."
	macroShapeInformation.Statustip = "Select objects and run this tool."
	macroShapeInformation.Pixmap = "ShapeInformation"
	macroShapeInformation.Accel = "Alt+I"
	macroPath = registerMacro(title, iconPath, macroShapeInformation)
	if macroPath == None:
		sys.exit()
	
	shutil.copy(scriptDir + "/macros/FunctionPolyline.FCMacro", macroPath)
	shutil.copy(scriptDir + "/macros/ShapeInformation.FCMacro", macroPath)
	shutil.copyfile(scriptDir + "/uninstall.py", freeCADHome + "/uninstall-" + title + ".py");

	if not os.path.exists(iconPath):
		os.mkdir(iconPath)
	shutil.copy(scriptDir + "/icons/FunctionPolyline.svg", iconPath)
	shutil.copy(scriptDir + "/icons/ShapeInformation.svg", iconPath)

if __name__ == "__main__":
	install()
	print("done.")