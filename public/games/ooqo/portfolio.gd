extends Node
## 常驻于场景树根部的宿主适配；原作切换标题、角色和关卡时不会销毁它。

var bridge: JavaScriptObject
var pause_callback: JavaScriptObject
var resume_callback: JavaScriptObject
var dispose_callback: JavaScriptObject
var suspended := false
var disposed := false
var previous_pause := false
var previous_mute := false

func _ready() -> void:
	bridge = JavaScriptBridge.get_interface("ooqoPortfolio")
	pause_callback = JavaScriptBridge.create_callback(_pause)
	resume_callback = JavaScriptBridge.create_callback(_resume)
	dispose_callback = JavaScriptBridge.create_callback(_dispose)
	bridge.pause = pause_callback
	bridge.resume = resume_callback
	bridge.dispose = dispose_callback
	# 将适配节点从「当前场景」职责中移出，原作仍管理自己的场景切换。
	get_tree().current_scene = null
	get_tree().change_scene_to_file("res://scenes/title.tscn")
	await get_tree().scene_changed
	await RenderingServer.frame_post_draw
	bridge.ready()

func _pause(_args: Array) -> void:
	if suspended or disposed:
		return
	suspended = true
	previous_pause = get_tree().paused
	previous_mute = AudioServer.is_bus_mute(0)
	get_tree().paused = true
	AudioServer.set_bus_mute(0, true)

func _resume(_args: Array) -> void:
	if not suspended or disposed:
		return
	suspended = false
	get_tree().paused = previous_pause
	AudioServer.set_bus_mute(0, previous_mute)

func _dispose(_args: Array) -> void:
	if disposed:
		return
	disposed = true
	get_tree().paused = true
	AudioServer.set_bus_mute(0, true)
