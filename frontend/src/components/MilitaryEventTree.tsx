import type { MilitaryEvent } from "../entities/MilitaryEvent";
import React, { useRef, useEffect, useState } from "react";
import { getStatusColorForMilitaryEvents } from "../utils/colorUtils";

import * as d3 from "d3";

type EventNode = {
  id: number;
  name: string;
  index?: number;
  isLeaf?: boolean;
  descendant_count?: number;
  start_date?: number;
  end_date?: number;
  status?: string;
  me?:MilitaryEvent;
  children?: EventNode[];
};



interface MilitaryEventTreeProps {
  selectedYear: number;
  militaryEvents:MilitaryEvent[];
  setSelectedObject: (obj: any) => void;
}

const MilitaryEventTree: React.FC<MilitaryEventTreeProps> = ({
  selectedYear,
  militaryEvents, 
  setSelectedObject
}) => {
  
  const [militaryEventsTree, setMilitaryEventsTree] = useState<EventNode>({ id: 0, name: "Root", children: [] });
  const [maxNumberOfNodesAtDepth, setMaxNumberOfNodesAtDepth] = useState<number>(0);
  const [maxNumberDepth, setMaxNumbeDepth] = useState<number>(0);

    
  useEffect(() => {
    const map = new Map<number, EventNode>();
    const mapDepthLevel = new Map<number, number>();

    const defineStatus = (me: MilitaryEvent, y: number) => {
        const s = me.start_date;
        const e = me.end_date;

        if (s != null && e != null) return (s <= y && y <= e) ? "ongoing" : (y < s ? "upcoming" : "ended");
        if (s != null && e == null) return (s <= y) ? "ongoing" : "upcoming";
        if (s == null && e != null) return (y <= e) ? "ongoing" : "ended";
        return "unknown";
    };

    militaryEvents.forEach(ev => {
      map.set(ev.id, { id: ev.id, name: ev.name, isLeaf:true, index:0, start_date:ev.start_date, end_date:ev.end_date, descendant_count:ev.descendant_count, status:defineStatus(ev, selectedYear), me:ev ,children: [] });
      const dLevel_count = mapDepthLevel.get(ev.depth_level) || 0;
      mapDepthLevel.set(ev.depth_level, dLevel_count + 1);
    });

    const root: EventNode = { id: 0, name: "Root", isLeaf:false, children: [] };

    militaryEvents.forEach(ev => {

      if (militaryEvents.length>1000 && ev.descendant_count==0) return;
      const node = map.get(ev.id)!;
      const pid = ev.parent_id;
      const pNode = pid?map.get(pid):root;
      const parentNode = pNode? pNode : root;
        
      parentNode.children!.push(node);
      node.index = parentNode.children!.length - 1;
      parentNode.isLeaf = false;
    });
    setMaxNumberOfNodesAtDepth(Math.max(...Array.from(mapDepthLevel.values())));
    setMaxNumbeDepth(Math.max(...Array.from(mapDepthLevel.keys())))
    setMilitaryEventsTree(root.children![0] || root);

  }, [militaryEvents, selectedYear]);

  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!militaryEventsTree || !svgRef.current) return;
  
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();



    const dx = (700/maxNumberOfNodesAtDepth)<8?8:(700/maxNumberOfNodesAtDepth);
    const dy = 700/maxNumberDepth;

    const root = d3.hierarchy<EventNode>(militaryEventsTree as EventNode);
    const treeLayout = d3.tree<EventNode>().nodeSize([dx, dy]);
    treeLayout(root);

  
    const nodes = root.descendants();
    const xs = nodes.map((d) => d.x ?? 0);
    const ys = nodes.map((d) => d.y ?? 0);

    const xMin = Math.min(...xs);
    const xMax = Math.max(...xs);
    const yMin = Math.min(...ys);
    const yMax = Math.max(...ys);

    // padding
    const paddingX = 50;
    const paddingY = 50;

    const autoWidth = (xMax - xMin) + paddingX;
    const autoHeight = (yMax - yMin) + dy;


    svg.attr("width", autoHeight).attr("height", autoWidth);


    const g = svg
      .append("g")
      .attr("stroke-linejoin", "round")
      .attr("stroke-width", 3)
      .attr("transform", `translate(${paddingY+100},${paddingX-xMin})`)
      .attr("style", "max-width:100%; height: auto; height: intrinsic;")
      .attr("font-family", "sans-serif")
      .attr("font-size", 10);
  
    const linkGenerator = d3
      .linkHorizontal<
        d3.HierarchyPointLink<EventNode>,
        d3.HierarchyPointNode<EventNode>
      >()
      .x((d) => d.y ?? 0)
      .y((d) => d.x ?? 0);

    g.selectAll(".link")
      .data(root.links())
      .enter()
      .append("path")
      .attr("class", "link")
      .attr("d", linkGenerator as any)
      .attr("fill", "none")
      .attr("stroke", (l) => getStatusColorForMilitaryEvents(l.target.data.status))
      .attr("stroke-width", (l) => (l.target.data.status === "ongoing" ? 2 : 1.2))
      .attr("opacity", (l) => (l.target.data.status === "ongoing" ? 1 : 0.35));

    const node = g
      .selectAll(".node")
      .data(nodes)
      .enter()
      .append("g")
      .attr("class", "node")
      .attr("transform", (d) => `translate(${d.y ?? 0},${d.x ?? 0})`)
      .attr("cursor", "pointer")
      .on("click", (_, d) => setSelectedObject(d.data.me));

    node
      .append("circle")
      .attr("r", 5)
      .attr("fill", (d) => getStatusColorForMilitaryEvents(d.data.status))
      
    node.append("text")
        .attr("dy", "1.6em")
        .attr("text-anchor", (d) => d.data.isLeaf ? "start" : "end")
        .attr("y", d => d.data.isLeaf ? 0: -12)
        .attr("x", d => d.data.isLeaf ? 0: -12)
        .attr("transform", (d) => {
          return d.data.isLeaf ? "translate(10,-10)" : `translate(10,-10)`; 
        })
        .attr("fill", (d) => getStatusColorForMilitaryEvents(d.data.status))
        .attr("font-size", (d) => (d.data.status=="ongoing" ? "10px" : "9px"))
        .attr("font-family", "Arial, sans-serif")
        .attr("font-weight", (d) => (d.data.status=="ongoing" ? "bold" : "normal"))
        .attr("stroke","#d8d8d8cf")
        .attr("paint-order", "stroke")
        .text(d => d.data.name.toLocaleUpperCase())
        .call((text) => {
          text.each(function(d) {
            const self = d3.select(this);
            const textLength = (self.node() as SVGTextElement).getComputedTextLength();
            const availableWidth = d.data.isLeaf ? dy : dy-20; 

            if (textLength > availableWidth) {
              let truncatedText = d.data.name.toLocaleUpperCase();
              while (truncatedText.length > 0 && (self.text(truncatedText + '...').node() as SVGTextElement).getComputedTextLength() > availableWidth) {
                truncatedText = truncatedText.slice(0, -1);
              }
              self.text(truncatedText + '...');
            }
          }); 
        });

}, [militaryEventsTree, selectedYear, setSelectedObject]);


  return (
  
      <div style={{ width:"100%" }}>
        <svg ref={svgRef} />
      </div>
  
);
};

export default MilitaryEventTree;