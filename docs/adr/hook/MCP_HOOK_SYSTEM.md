# ADR-001: MCP Workflow System Architecture

## Status

Accepted

> **Update (2025-10)**: Workflow/Hook モジュールは v0.5 系で削除されました。本 ADR は履歴参照用途としてのみ保持しています。


## Context

MCP Router 銇€佽鏁般伄 MCP (Model Context Protocol) 銈点兗銉愩兗銈掔当鍚堛仐銆佸崢涓€銇偍銉炽儔銉濄偆銉炽儓銇ㄣ仐銇︽鑳姐仚銈嬨偡銈广儐銉犮仹銇欍€傘儲銉笺偠銉笺亱銈夈€丮CP 銉偗銈ㄣ偣銉?銉偣銉濄兂銈广伄鍑︾悊銉曘儹銉笺伀銈偣銈裤儬銉偢銉冦偗銈掓尶鍏ャ仐銇熴亜銇ㄣ亜銇嗚鏈涖亴銇傘倞銇俱仐銇熴€?

涓汇仾瑕佷欢锛?
- 銉偗銈ㄣ偣銉堥€佷俊鍓嶏紙Pre-hook锛夈仺銉偣銉濄兂銈瑰彈淇″緦锛圥ost-hook锛夈伄涓℃柟銇с偒銈广偪銉犮儹銈搞儍銈倰瀹熻
- 鏉′欢銇熀銇ャ亜銇︺儶銈偍銈广儓銈掋儠銈ｃ儷銈裤儶銉炽偘銆佸鏇淬€併伨銇熴伅銉栥儹銉冦偗
- 銉︺兗銈躲兗銇?JavaScript 銇с儹銈搞儍銈倰瑷樿堪鍙兘
- 瀹夊叏銇疅琛岀挵澧冦伄鎻愪緵
- 銉撱偢銉ャ偄銉仾瀹熻銉曘儹銉笺伄瀹氱京

## Decision

### 1. 銈兗銈儐銈儊銉ｃ儜銈裤兗銉?

**Workflow涓績銇儮銈搞儱銉┿兗銈兗銈儐銈儊銉?*

Hook銇嫭绔嬨仐銇熴偡銈广儐銉犮仹銇仾銇忋€乄orkflow銈枫偣銉嗐儬銇儮銈搞儱銉笺儷锛堛儙銉笺儔锛夈仺銇椼仸瀹熻銇曘倢銇俱仚銆傘亾銈屻伀銈堛倞銆佸疅琛屻儠銉兗銇彲瑕栧寲銇ㄦ煍杌熴仾鍒跺尽銇屽彲鑳姐伀銇倞銇俱仚銆?

```
UI Layer (React)
    鈹溾攢鈹€ WorkflowEditor (React Flow)
    鈹?  鈹溾攢鈹€ StartNode
    鈹?  鈹溾攢鈹€ EndNode
    鈹?  鈹溾攢鈹€ MCPCallNode
    鈹?  鈹斺攢鈹€ HookNode (Module)
    鈫?
Workflow Engine
    鈹溾攢鈹€ Workflow Definition
    鈹溾攢鈹€ Node Execution
    鈹斺攢鈹€ Hook Script Execution
```

### 2. Workflow銈枫偣銉嗐儬

**銉撱偢銉ャ偄銉儣銉偘銉┿儫銉炽偘銉戙儵銉€銈ゃ儬**

React Flow銈掍娇鐢ㄣ仐銇熴儞銈搞儱銈儷銈ㄣ儑銈ｃ偪銇с€併儙銉笺儔銈掋儔銉┿儍銈?銉夈儹銉冦儣銇椼仸鍑︾悊銉曘儹銉笺倰瀹氱京銇椼伨銇欍€?

```typescript
interface WorkflowDefinition {
  id: string;
  name: string;
  description?: string;
  workflowType: "tools/list" | "tools/call";
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  enabled: boolean;
  createdAt: number;
  updatedAt: number;
}
```

### 3. 銉庛兗銉夈偪銈ゃ儣

#### 3.1 鍩烘湰銉庛兗銉?

```typescript
interface WorkflowNode {
  id: string;
  type: "start" | "end" | "mcp-call" | "hook";
  position: { x: number; y: number };
  data: {
    label: string;
    hook?: WorkflowHook;  // type === 'hook' 銇牬鍚?
    [key: string]: any;
  };
  deletable?: boolean;
}
```

#### 3.2 Hook銉庛兗銉夛紙銉偢銉ャ兗銉級

Hook銇儻銉笺偗銉曘儹銉笺伄涓€閮ㄣ仺銇椼仸銆佷互涓嬨伄鐗规€с倰鎸併仱銉偢銉ャ兗銉仹銇欙細

```typescript
interface WorkflowHook {
  id: string;
  script: string;      // JavaScript code
  blocking: boolean;   // true: 鍚屾湡瀹熻, false: 闈炲悓鏈燂紙Fire & Forget锛?
}
```

**銉庛兗銉夈伄鍏ュ嚭鍔涘埗绱勶細**
- **Start Node**: 鍏ュ姏銇仐銆佸嚭鍔涜鏁板彲
- **End Node**: 鍏ュ姏1銇ゃ伄銇裤€佸嚭鍔涖仾銇?
- **MCP Call Node**: 鍏ュ姏1銇ゃ€佸嚭鍔涜鏁板彲
- **Sync Hook** (blocking=true): 鍏ュ姏1銇ゃ€佸嚭鍔涜鏁板彲
- **Fire-and-forget Hook** (blocking=false): 鍏ュ姏1銇ゃ€佸嚭鍔涖仾銇?

### 4. Hook瀹熻鐠板

**Workflow Engine鍐呫仹銇偟銉炽儔銉溿儍銈偣瀹熻**

Hook銈广偗銉儣銉堛伅銆乄orkflow Engine銇倛銇ｃ仸绠＄悊銇曘倢銆佷互涓嬨伄鐠板銇у疅琛屻仌銈屻伨銇欙細

```javascript
// Hook Context
{
  request: {
    method: string,    // MCP銉°偨銉冦儔鍚?
    params: any        // 銉偗銈ㄣ偣銉堛儜銉┿儭銉笺偪
  },
  response?: any,      // Post-hook銇牬鍚堛伄銉偣銉濄兂銈?
  metadata: {
    clientId: string,
    serverName?: string,
    workflowId: string,
    nodeId: string
  }
}
```

### 5. 瀹熻銉曘儹銉?

#### 5.1 Workflow瀹熻闋嗗簭

```
Start 鈫?[Pre-hooks] 鈫?MCP Call 鈫?[Post-hooks] 鈫?End
         鈫?                         鈫?
    [Fire & Forget]            [Fire & Forget]
```

#### 5.2 瀹熻闋嗗簭姹哄畾銈儷銈淬儶銈恒儬

1. **涓荤祵璺紙Main Path锛夈伄鐗瑰畾**
   - Start銉庛兗銉夈亱銈夐爢娆″疅琛?
   - 鍚屾湡銉庛兗銉夈伅瀹屼簡銈掑緟銇?
   - 闈炲悓鏈熴儙銉笺儔銇嵆搴с伀娆°伕閫层個

2. **鍒嗗矏鍑︾悊**
   - Fire-and-forget銉庛兗銉夈伅涓﹀垪瀹熻
   - 銈ㄣ儵銉笺亴銇傘仯銇︺倐銉°偆銉炽儠銉兗銇稒缍?

```typescript
async function executeWorkflow(workflow: WorkflowDefinition, context: Context) {
  const startNode = workflow.nodes.find(n => n.type === 'start');
  let currentNode = startNode;
  
  while (currentNode && currentNode.type !== 'end') {
    // 銉庛兗銉夊疅琛?
    if (currentNode.type === 'hook') {
      if (currentNode.data.hook?.blocking) {
        await executeHookSync(currentNode.data.hook, context);
      } else {
        executeHookAsync(currentNode.data.hook, context); // 寰呫仧銇亜
      }
    } else if (currentNode.type === 'mcp-call') {
      await executeMCPCall(context);
    }
    
    // 娆°伄銉庛兗銉夈伕
    const outgoingEdge = workflow.edges.find(e => e.source === currentNode.id);
    currentNode = workflow.nodes.find(n => n.id === outgoingEdge?.target);
  }
}
```

### 6. Visual Editor姗熻兘

**React Flow銉欍兗銈广伄銈ㄣ儑銈ｃ偪**

- 銉夈儵銉冦偘&銉夈儹銉冦儣銇с儙銉笺儔閰嶇疆
- 銉庛兗銉夐枔銇帴缍氥倰銉撱偢銉ャ偄銉伀瀹氱京
- 銉偄銉偪銈ゃ儬銉愩儶銉囥兗銈枫儳銉?
- Hook script inline绶ㄩ泦

## Consequences

### Positive

1. **鍙鎬с伄鍚戜笂**
   - 瀹熻銉曘儹銉笺亴涓€鐩仹鐞嗚В銇с亶銈?
   - 銉囥儛銉冦偘銇屽鏄?
   - 銉庛兂銉椼儹銈般儵銉炪兗銇с倐鍩烘湰鐨勩仾銉曘儹銉笺倰鐞嗚В鍙兘

2. **銉偢銉ャ儵銉艰ō瑷?*
   - Hook銇啀鍒╃敤鍙兘銇儮銈搞儱銉笺儷
   - 鏂般仐銇勩儙銉笺儔銈裤偆銉椼伄杩藉姞銇屽鏄?
   - 璨嫏銇槑纰恒仾鍒嗛洟

3. **鏌旇粺鎬?*
   - 瑜囬洃銇儠銉兗銈傝瑕氱殑銇绡夊彲鑳?
   - 鍚屾湡/闈炲悓鏈熴伄娣峰湪銇屽彲鑳?
   - 鏉′欢鍒嗗矏銇皢鏉ョ殑銇拷鍔犮亴瀹规槗

4. **淇濆畧鎬?*
   - Workflow銇疛SON銇ㄣ仐銇︿繚瀛?
   - 銉愩兗銈搞儳銉崇鐞嗐亴瀹规槗
   - 銈ㄣ偗銈广儩銉笺儓/銈ゃ兂銉濄兗銉堛亴鍙兘

### Negative

1. **瑜囬洃鎬с伄澧楀姞**
   - UI銇疅瑁呫亴瑜囬洃
   - 銉︺兗銈躲兗銇缈掓洸绶?

2. **銉戙儠銈┿兗銉炪兂銈?*
   - 銉撱偢銉ャ偄銉偍銉囥偅銈裤伄銈兗銉愩兗銉樸儍銉?
   - 澶ц妯°仾銉兗銈儠銉兗銇弿鐢汇偝銈广儓

3. **鍒剁磩**
   - 鐝惧湪銇潯浠跺垎宀愩仾銇楋紙灏嗘潵鐨勩伀杩藉姞浜堝畾锛?
   - 銉兗銉楁閫犮仾銇楋紙鎰忓洺鐨勩仾鍒堕檺锛?

## Migration Path

### Phase 1: 鐝惧湪銇疅瑁?
- 鍩烘湰鐨勩仾Workflow銈ㄣ儑銈ｃ偪
- Hook銆丼tart銆丒nd銆丮CP Call銉庛兗銉?
- 绶氬舰銉曘儹銉笺伄銈点儩銉笺儓

### Phase 2: 灏嗘潵銇嫛寮?
- 鏉′欢鍒嗗矏銉庛兗銉?
- 澶夋暟/鐘舵厠绠＄悊銉庛兗銉?
- 銈偣銈裤儬銉庛兗銉夈偪銈ゃ儣銇儣銉┿偘銈ゃ兂鍖?
- Workflow銉嗐兂銉椼儸銉笺儓/銉炪兗銈便儍銉堛儣銉偆銈?

## Implementation Notes

1. **銈ㄣ儵銉笺儚銉炽儔銉兂銈?*: 
   - 鍚屾湡Hook銇偍銉┿兗銇儠銉兗銈掑仠姝?
   - 闈炲悓鏈烪ook銇偍銉┿兗銇儹銈般伄銇?

2. **姘哥稓鍖?*: 
   - Workflow銇疛SON銇ㄣ仐銇︺儹銉笺偒銉偣銉堛儸銉笺偢銇繚瀛?
   - 灏嗘潵鐨勩伀銇儑銉笺偪銉欍兗銈广伕绉昏

3. **瀹熻銉儖銈裤儶銉炽偘**:
   - 鍚勩儙銉笺儔銇疅琛岀姸鎱嬨倰鍙鍖?
   - 瀹熻鏅傞枔銇▓娓仺銉溿儓銉儘銉冦偗鐗瑰畾

## References

- [React Flow Documentation](https://reactflow.dev/)
- [MCP Protocol Specification](https://modelcontextprotocol.io/docs)
- [Visual Programming Languages](https://en.wikipedia.org/wiki/Visual_programming_language)
