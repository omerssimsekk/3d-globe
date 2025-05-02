import {
  ArcCurve,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  Color,
  Group,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  Points,
  PointsMaterial,
  Vector3,
  BoxGeometry,
} from "three";
import { LineGeometry } from "three/examples/jsm/lines/LineGeometry";
import { Line2 } from "three/examples/jsm/lines/Line2";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial";
import { _3Dto2D, radianAOB, threePointCenter } from "@/lib/utils/math";
import { setTween } from "@/lib/utils/tween";
import { FlyLineData, LineStyle, StoreConfig } from "@/lib/interface";
import Store from "@/lib/store/store";
import { addUserDataToMesh } from "@/lib/utils";
import { merge } from "lodash";
import { cloneDeep } from "lodash-es";

export default class FlyLine3d {
  private readonly _config: StoreConfig;
  _store: Store;
  _currentData: FlyLineData;
  _currentConfig: LineStyle;
  constructor(store: Store, currentData: FlyLineData) {
    this._store = store;
    this._config = store.getConfig();
    this._currentConfig = cloneDeep({
      flyLineStyle: this._config.flyLineStyle,
      pathStyle: this._config.pathStyle,
    });
    this._currentData = currentData;
    if (currentData.style) {
      merge(this._currentConfig, currentData.style);
    }
  }
  createMesh(positionInfo: [Vector3, Vector3]) {
    const group = new Group();
    const [sourcePoint, targetPoint] = positionInfo;

    //算出两点之间的中点向量
    const middleV3 = new Vector3()
      .addVectors(sourcePoint, targetPoint)
      .clone()
      .multiplyScalar(0.5);
    //然后计算方向向量
    const dir = middleV3.clone().normalize();
    const s = radianAOB(sourcePoint, targetPoint, new Vector3(0, 0, 0));
    const RMultiplier = 0.2; // Adjust as needed
    const middlePos = dir.multiplyScalar(
      this._config.R + s * this._config.R * RMultiplier
    );
    //寻找三个圆心的坐标
    const centerPosition = threePointCenter(
      sourcePoint,
      targetPoint,
      middlePos
    );
    if (!centerPosition) {
      console.warn("Could not calculate center for flyline arc, using straight line or default.");
      return group;
    }
    //求得半径
    const R = middlePos.clone().sub(centerPosition).length();
    const c = radianAOB(sourcePoint, new Vector3(0, -1, 0), centerPosition);
    const startDeg = -Math.PI / 2 + c; //飞线圆弧开始角度
    const endDeg = Math.PI - startDeg; //飞线圆弧结束角度

    // --- Create the arc path points ---
    const curve = new ArcCurve(
      centerPosition.x,
      centerPosition.y, // ax, aY
      R, // xRadius, yRadius
      startDeg,
      endDeg, // aStartAngle, aEndAngle
      false // aClockwise
    );
    // Map Vector2 points to Vector3 points (z=0)
    const arcPoints: Vector3[] = curve.getSpacedPoints(200).map(p => new Vector3(p.x, p.y, 0)); 

    // --- Create the airplane mesh ---
    const airplaneMesh = this.createAirplaneMesh();
    airplaneMesh.position.copy(arcPoints[0]); // Start at the beginning of the arc

    // --- Create the static path line (optional) ---
    const pathLine = this.createPathLineFromPoints(arcPoints); // Use existing points

    // --- Animate the airplane along the arc ---
    let currentPointIndex = 0;
    setTween(
      { t: 0 }, // Animate a value t from 0 to 1
      { t: 1 },
      (params) => {
        const pointIndex = Math.floor(params.t * (arcPoints.length - 1));
        if (pointIndex < arcPoints.length) {
          const currentPoint = arcPoints[pointIndex];
          airplaneMesh.position.copy(currentPoint);

          // Orient the airplane to the next point (look ahead)
          if (pointIndex < arcPoints.length - 1) { 
            const nextPoint = arcPoints[pointIndex + 1];
            airplaneMesh.lookAt(nextPoint);
            // Optional: Add rotation if the default lookAt isn't quite right
            // airplaneMesh.rotateX(Math.PI / 2); // Example adjustment
          }
        }
      },
      {
        ...this._currentConfig.flyLineStyle,
        data: this._currentData,
        duration: this._currentConfig.flyLineStyle.duration || 10000, // Explicitly set a longer duration (10 seconds)
      }
    );

    group.add(airplaneMesh);
    if (this._currentConfig.pathStyle.show !== false) {
      group.add(pathLine);
    }
    group.name = "flyLine";
    // Add user data directly to the group
    group.userData = { ...this._currentData, type: 'flyLine' }; 
    return group;
  }
  createPathLineFromPoints = (points: Vector3[]) => {
    const geometry = new LineGeometry();
    geometry.setPositions(points.map((item) => [item.x, item.y, 0]).flat());
    const material = new LineMaterial({
      color: new Color(this._currentConfig.pathStyle.color).getHex(),
      linewidth: (this._currentConfig.pathStyle.size || 1) / 1000,
      vertexColors: false,
      dashed: false,
      alphaToCoverage: false,
    });
    const pathLine = new Line2(geometry, material);
    pathLine.name = "pathLine";
    // Removed addUserDataToMesh here, added to group instead
    return pathLine;
  };
  createAirplaneMesh = () => {
    const airplaneGroup = new Group();
    airplaneGroup.name = "airplaneMesh"; 

    // Original box geometry calculation
    const fuselageLength = (this._currentConfig.flyLineStyle.size || 3.0) * 2.5;
    const wingSpan = fuselageLength * 1.2;
    const thickness = fuselageLength * 0.15;

    const fuselageGeometry = new BoxGeometry(thickness, thickness, fuselageLength);
    const wingGeometry = new BoxGeometry(wingSpan, thickness, fuselageLength * 0.3);

    const material = new MeshBasicMaterial({
      color: this._currentConfig.flyLineStyle.color || "#ffff00", // Use configured color or default
      // depthWrite: false, // Optional
    });

    const fuselage = new Mesh(fuselageGeometry, material);
    const wings = new Mesh(wingGeometry, material);
    wings.position.z = -fuselageLength * 0.1; // Position wings

    airplaneGroup.add(fuselage);
    airplaneGroup.add(wings);

    // Original rotation for alignment with lookAt
    airplaneGroup.rotateX(Math.PI / 2);

    return airplaneGroup;
  };
  create(src: Vector3, dist: Vector3) {
    //创建线
    const { quaternion, startPoint3D, endPoint3D } = _3Dto2D(src, dist);
    const flyLineMesh = this.createMesh([startPoint3D, endPoint3D]);
    flyLineMesh.quaternion.multiply(quaternion);
    return flyLineMesh;
  }
}
