<script setup lang="ts">
import { onMounted } from "vue";
import world from "./map/world.json";
import chart from "@/entry";
import ChartScene from "@/lib/chartScene";
import barData from "./devData/barData";
import { getScale } from "@/lib/utils/math";

const chinaData = world.features.find((item: any) => {
  return item.properties.name === "China";
})!.geometry.coordinates as any;

let chartInstance1: ChartScene;
const geoJson: any = world;
chart.registerMap("world", geoJson);
onMounted(() => {
  
  const dom1 = document.getElementById("container1");
  if (dom1) { // Simplified check for only dom1
    
    chartInstance1 = chart.init({
      dom: dom1,
      helper: false,
      map: "world",
      autoRotate: true,
      mode: "3d",
      rotateSpeed: 0.005,
      limitFps: false,
      config: {
        enableZoom: true,
        stopRotateByHover: false,
        R: 120,
        earth: {
          color: "#0077ff",
          material: "MeshBasicMaterial",
          dragConfig: {
            disableY: true,
          },
        },
        flyLineStyle: {
          duration: 3000,
          size: 3
        },
        mapStyle: {
          lineColor: "#ffffff",
          areaColor: "#33cc33",
        },
        bgStyle: {
          color: "#0e0c15",
        },
        spriteStyle: {
          color: "#272335",
          show: true,
        },
        hoverRegionStyle: {
          areaColor: "#ffa500",
        },
        textMark: {
          style: {
            fontSize: 32,
          },
          data: [
            {
              text: "United States",
              position: { lon: -98.5, lat: 39.8 }
            },
            { text: "Canada", position: { lon: -106.3, lat: 56.1 } },
            { text: "Mexico", position: { lon: -102.5, lat: 23.6 } },
            { text: "Brazil", position: { lon: -51.9, lat: -14.2 } },
            { text: "Argentina", position: { lon: -63.6, lat: -38.4 } },
            { text: "United Kingdom", position: { lon: -3.4, lat: 55.3 } },
            { text: "France", position: { lon: 2.2, lat: 46.2 } },
            { text: "Germany", position: { lon: 10.4, lat: 51.1 } },
            { text: "Spain", position: { lon: -3.7, lat: 40.4 } },
            { text: "Italy", position: { lon: 12.5, lat: 41.8 } },
            { text: "Russia", position: { lon: 105.3, lat: 61.5 } },
            { text: "China", position: { lon: 104.1, lat: 35.8 } },
            { text: "India", position: { lon: 78.9, lat: 20.5 } },
            { text: "Japan", position: { lon: 138.2, lat: 36.2 } },
            { text: "South Korea", position: { lon: 127.7, lat: 35.9 } },
            { text: "Australia", position: { lon: 133.7, lat: -25.2 } },
            { text: "South Africa", position: { lon: 22.9, lat: -30.5 } },
            { text: "Nigeria", position: { lon: 8.6, lat: 9.0 } },
            { text: "Egypt", position: { lon: 30.8, lat: 26.8 } },
            { text: "Saudi Arabia", position: { lon: 45.0, lat: 23.8 } },
            { text: "Turkey", position: { lon: 35.2, lat: 38.9 } },
          ]
        },
      },
    });
    const initData1 = [
      {
        from: {
          id: "1",
          lon: -23.0075,
          lat: 50.4296,
        },
        to: { id: 2, lon: 26.1223, lat: -7.8756 },
      },
      {
        from: {
          lon: 142.8123,
          lat: -58.9813,
          style: {
            color: "yellow",
          },
        },
        to: {
          lon: 157.0064,
          lat: 10.7816,
          style: {
            color: "yellow",
          },
        },
        style: {
          pathStyle: {
            color: "yellow",
          },
          flyLineStyle: {
            color: "yellow",
          },
        },
      },
      {
        from: { lon: -175.6286, lat: 72.8359 },
        to: { lon: -39.071, lat: -35.438 },
      },
      {
        from: { lon: 178.7439, lat: 25.8303 },
        to: { lon: 137.19, lat: 17.118 },
      },
      {
        from: { lon: -162.6725, lat: 37.277 },
        to: { lon: -37.1681, lat: 38.5162 },
      },
      {
        from: { lon: -7.5945, lat: 37.2754 },
        to: { lon: 41.4114, lat: 41.5946 },
      },
    ];
    const maxHeight = getScale(
      barData.map((item) => item[2]),
      120
    );
    const initBarData = barData.map((item) => {
      return {
        position: {
          lon: item[0],
          lat: item[1],
        },
        value: item[2] * maxHeight,
      };
    });
    // chartInstance1.addData("bar", initBarData);

    let i = 0;
    function polling() {
      setTimeout(() => {
        i++;
        if (i < initData1.length) {
          polling();
          chartInstance1.addData("flyLine", [initData1[i]]);
        }
      }, 1000);
    }
    polling();
    chartInstance1.on("click", (event: Event, mesh: any) => {
      // chartInstance1.options.autoRotate = false;
      chartInstance1.remove("mapStreamLine");
    });
    // chinaData.forEach((item: any) => {
    //   chartInstance1.addData("mapStreamLine", {
    //     data: item,
    //     style: {
    //       opacity: 1,
    //     },
    //   });
    // });
  }
});

function del() {
  chartInstance1.remove("bar", "removeAll");
}
</script>

<template>
  <div @click="del"></div>
  
  <div style="position: relative">
    <div id="container1"></div>
  </div>
</template>

<style lang="less" scoped>
#container1 {
  width: 800px;
  height: 800px;
}
</style>
