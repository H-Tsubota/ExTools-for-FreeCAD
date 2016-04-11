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

def unregisterMacro(title, iconPath, macro):
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
		macroPath = freeCADHome + "/"

	# Unregister macro icon path for ExTools
	bitmapsNode = getNode(root, "Root/BaseApp/Preferences/Bitmaps")
	existPath = False
	deleting = []
	for path in bitmapsNode.childNodes:
		if path != None and path.hasChildNodes() and (path.childNodes[0].nodeType == path.TEXT_NODE):
			if path.childNodes[0].data == iconPath:
				deleting.append(path)
	for node in deleting:
		bitmapsNode.removeChild(node)
	
	macros = getNode(root, "Root/BaseApp/Macro/Macros")
	deleting = []
	for m in macros.childNodes:
		script = getNode(m, "Script")
		if script != None and script.hasChildNodes() and (script.childNodes[0].nodeType == script.TEXT_NODE):
			if script.childNodes[0].data == macro.Script:
				deleting.append(m)
	for node in deleting:
		macros.removeChild(node)
	
	# Unregister to Workbench
	destWorkbench = getNode(root, "Root/BaseApp/Workbench/Global")
	if destWorkbench != None :
		destToolbar = getNode(root, "Root/BaseApp/Workbench/Global/Toolbar")
		if destToolbar != None:
			deleting = []
			for custom in destToolbar.childNodes:
				name = getNode(custom, "Name")
				if name != None and name.hasChildNodes() and (name.childNodes[0].nodeType == name.TEXT_NODE):
					if name.childNodes[0].data == title:
						deleting.append(custom)
			for node in deleting:
				destToolbar.removeChild(node)
	
	# Unregister to MainWindow
	mainWindowToolbar = getNode(root, "Root/BaseApp/MainWindow/Toolbars")
	if mainWindowToolbar != None:
		mainWindowToolbarTools = getNode(root, "Root/BaseApp/MainWindow/Toolbars/" + title)
		if mainWindowToolbarTools != None:
			mainWindowToolbar.removeChild(mainWindowToolbarTools)
	
	dom.writexml(open(freeCADHome + "/user.cfg","w"))
	return macroPath

def install():
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
	macroFunctionPolyline.Statustip = 'Type your function and click "Add"'
	macroFunctionPolyline.Pixmap = "FunctionPolyline"
	macroFunctionPolyline.Accel = "Alt+P"
	macroPath = unregisterMacro(title, iconPath, macroFunctionPolyline)
	if macroPath == None:
		sys.exit()
	
	macroShapeInformation = Macro()
	macroShapeInformation.Script = "ShapeInformation.FCMacro"
	macroShapeInformation.Menu = "Shape Information..."
	macroShapeInformation.Tooltip = "Show volume, area and center of mass."
	macroShapeInformation.WhatsThis = "Show volume, area and center of mass."
	macroShapeInformation.Statustip = ""
	macroShapeInformation.Pixmap = "ShapeInformation"
	macroShapeInformation.Accel = "Alt+I"
	macroPath = unregisterMacro(title, iconPath, macroShapeInformation)
	if macroPath == None:
		sys.exit()
	
	#  Delete macro
	if os.path.exists(macroPath + "/FunctionPolyline.FCMacro"):
		os.remove(macroPath + "/FunctionPolyline.FCMacro")
	if os.path.exists(macroPath + "/ShapeInformation.FCMacro"):
		os.remove(macroPath + "/ShapeInformation.FCMacro")

	# Delete icon
	if os.path.exists(iconPath):
		shutil.rmtree(iconPath)

if __name__ == "__main__":
	install()
	print("done.")