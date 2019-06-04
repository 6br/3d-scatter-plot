#!/bin/ruby
require "json"

t = 350
json = JSON.load(File.read("sample/all_time_axes_dict.json"))
lr = json["lr"][t]
va = json["va"][t]
vd = json["vd"][t]

cellpos = lr.zip(va, vd)
File.write("json/cells.json", JSON.dump(cellpos))

json = JSON.load(File.read("sample/all_time_cdx4_exp_list.json"))
exp = json[t]
File.write("json/exp.json", JSON.dump(exp))

json = JSON.load(File.read("sample/all_time_axes_dict.json"))
array = []
for i in 0..699 do
    lr = json["lr"][i]
    va = json["va"][i]
    vd = json["vd"][i]

    cellpos = lr.zip(va, vd)
    array << cellpos
end
File.write("dist/all_cells.json", JSON.dump(array))

