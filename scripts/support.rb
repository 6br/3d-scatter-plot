#!/bin/ruby
require "json"

t = 350
json = JSON.load(File.read("sample/all_time_axes_dict.json"))
lr = json["lr"][t]
va = json["va"][t]
vd = json["vd"][t]

cellpos = lr.zip(va, vd)
File.write("cells.json", JSON.dump(cellpos))

json = JSON.load(File.read("sample/all_time_cdx4_exp_list.json"))
exp = json[t]
File.write("exp.json", JSON.dump(exp))
