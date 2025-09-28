# ADR: 銉偢銉ャ儵銉笺偄銉笺偔銉嗐偗銉併儯銇搞伄銉儠銈°偗銈裤儶銉炽偘
`
## 銈广儐銉笺偪銈?
閮ㄥ垎鐨勩伀瀹熸柦娓堛伩锛?025骞?鏈堬級

## 銈炽兂銉嗐偔銈广儓

鐝惧湪銇瓻lectron銈儣銉偙銉笺偡銉с兂銇儭銈ゃ兂銉椼儹銈汇偣銇?灞ゆ閫狅紙application銆乮nfrastructure銆乽tils锛夈倰鎺＄敤銇椼仸銇勩伨銇欍€傘仐銇嬨仐銆佷互涓嬨伄鍟忛銇屾畫瀛樸仐銇︺亜銇俱仚锛?

### 鐝剧姸銇晱椤岀偣

1. **寰挵渚濆瓨銇櫤鐢?*
    - infrastructure 鈫?application
    - application 鈫?infrastructure
    - 灞ら枔銇浉浜掍緷瀛樸亴娈嬪瓨

2. **璨换澧冪晫銇笉鏄庣⒑銇?*
    - application銇当鍚堛仌銈屻仧銇屾鑳姐伄鍒嗛銇屼笉鏄庣⒑
    - 鍚屼竴姗熻兘銇岃鏁般儑銈ｃ儸銈儓銉伀鍒嗘暎
    - 鏂拌闁嬬櫤鑰呫亴閬╁垏銇厤缃牬鎵€銈掑垽鏂仹銇嶃仾銇?

3. **銈炽兂銉堛儶銉撱儱銉笺偡銉с兂銇洶闆ｃ仌**
    - 瑜囬洃銇堡妲嬮€犮伀銈堛倞瀛︾繏銈炽偣銉堛亴楂樸亜
    - 銇┿亾銇綍銇屻亗銈嬨亱鐩存劅鐨勩仹銇亜
    - 銉嗐偣銉堛伄鏇搞亶鏂广亴涓嶆槑纰?

4. **淇濆畧鎬с伄浣庝笅**
    - 姗熻兘杩藉姞鏅傘伀瑜囨暟灞ゃ伄澶夋洿銇屽繀瑕?
    - 銉儠銈°偗銈裤儶銉炽偘銇屽洶闆?
    - 銉嗐偣銉堛偒銉愩儸銉冦偢銇⒑淇濄亴闆ｃ仐銇?

## 姹哄畾

姗熻兘銉偢銉ャ兗銉崢浣嶃仹鑷繁瀹岀祼銇椼仧妲嬮€狅紙Modular Architecture锛夈倰鎺＄敤銇椼伨銇欍€?

### 鏂般仐銇勩儑銈ｃ儸銈儓銉閫?

```
apps/electron/src/main/
鈹溾攢鈹€ modules/                 # 姗熻兘銉偢銉ャ兗銉紙鑷繁瀹岀祼锛? 灏嗘潵銇洰妯欐閫?
鈹?  鈹溾攢鈹€ auth/               # 瑾嶈銉偢銉ャ兗銉?
鈹?  鈹溾攢鈹€ mcp-apps-manager/   # MCP銈儣銉当鍚?
鈹?  鈹溾攢鈹€ mcp-logger/         # 銉偘绠＄悊
鈹?  鈹溾攢鈹€ mcp-server-manager/ # 銈点兗銉愮鐞?
鈹?  鈹溾攢鈹€ mcp-server-runtime/ # 銉┿兂銈裤偆銉?銉椼儹銈偡
鈹?  鈹溾攢鈹€ settings/           # 瑷畾绠＄悊
鈹?  鈹溾攢鈹€ system/             # 銈枫偣銉嗐儬銉︺兗銉嗐偅銉儐銈?
鈹?  鈹斺攢鈹€ workspace/          # 銉兗銈偣銉氥兗銈圭鐞?
鈹溾攢鈹€ infrastructure/         # 銈ゃ兂銉曘儵銈广儓銉┿偗銉併儯灞?
鈹?  鈹溾攢鈹€ database/           # 銉囥兗銈裤儥銉笺偣銈偗銈汇偣
鈹?  鈹斺攢鈹€ ipc.ts              # IPC閫氫俊
鈹溾攢鈹€ ui/                     # UI闁㈤€?
鈹?  鈹溾攢鈹€ menu.ts             # 銉°儖銉ャ兗
鈹?  鈹斺攢鈹€ tray.ts             # 銉堛儸銈?
鈹斺攢鈹€ utils/                  # 銉°偆銉炽儣銉偦銈圭敤銉︺兗銉嗐偅銉儐銈?
```

### 銉偢銉ャ兗銉閫犮伄瑭崇窗

鍚勩儮銈搞儱銉笺儷銇互涓嬨伄銉曘偂銈ゃ儷銇ф鎴愩仌銈屻伨銇欙細

1. **`.service.ts`** - 銉撱偢銉嶃偣銉偢銉冦偗
    - 銉夈儭銈ゃ兂鐭ヨ瓨銇疅瑁?
    - 銉撱偢銉嶃偣銉兗銉伄閬╃敤
    - 澶栭儴渚濆瓨銇偆銉炽偪銉笺儠銈с兗銈圭祵鐢?

2. **`.repository.ts`** - 銉囥兗銈裤偄銈偦銈瑰堡
    - 銉囥兗銈裤儥銉笺偣銇ㄣ伄銈勩倞鍙栥倞
    - 銉囥兗銈裤伄姘哥稓鍖栥仺鍙栧緱
    - SQLiteManager绲岀敱銇с伄銈偗銈汇偣

3. **`.ipc.ts`** - IPC銉忋兂銉夈儵銉?
    - 銉兂銉€銉┿兗銉椼儹銈汇偣銇ㄣ伄閫氫俊
    - 銈点兗銉撱偣銉°偨銉冦儔銇懠銇冲嚭銇?
    - 銉偣銉濄兂銈广伄鏁村舰

4. **`.types.ts`** - 鍨嬪畾缇?
    - 銉偢銉ャ兗銉浐鏈夈伄鍨?
    - 銈ゃ兂銈裤兗銉曘偋銉笺偣瀹氱京
    - 瀹氭暟瀹氱京

### 渚濆瓨闁總銇儷銉笺儷

```
IPC Handler 鈫?Service 鈫?Repository 鈫?Shared Database
     鈫?          鈫?          鈫?
   Types       Types       Types
```

- **鍗樻柟鍚戜緷瀛?*: 涓婁綅灞ゃ伅涓嬩綅灞ゃ伄銇裤伀渚濆瓨
- **妯伄渚濆瓨绂佹**: 銉偢銉ャ兗銉枔銇洿鎺ヤ緷瀛樸伅閬裤亼銈?
- **鍏遍€氭鑳界祵鐢?*: 銉偢銉ャ兗銉枔閫ｆ惡銇叡鏈夈偆銉炽偪銉笺儠銈с兗銈圭祵鐢?

### 渚濆瓨鎬ф敞鍏ャ儜銈裤兗銉?

```typescript
// modules/auth/auth.service.ts
export interface AuthRepository {
  findUserByEmail(email: string): Promise<User | null>;
  createUser(data: CreateUserDto): Promise<User>;
}

export class AuthService {
  constructor(private repository: AuthRepository) {}

  async authenticate(email: string, password: string) {
    // 銉撱偢銉嶃偣銉偢銉冦偗
  }
}

// modules/auth/auth.repository.ts
export class AuthRepositoryImpl implements AuthRepository {
  constructor(private db: Database) {}

  async findUserByEmail(email: string) {
    // 銉囥兗銈裤儥銉笺偣銈偗銈汇偣
  }
}

// modules/auth/auth.ipc.ts
export function registerAuthHandlers(authService: AuthService) {
  ipcMain.handle('auth:login', async (_, { email, password }) => {
    return authService.authenticate(email, password);
  });
}
```

### 銉嗐偣銉堟垿鐣?

```typescript
// modules/auth/__tests__/auth.service.test.ts
describe('AuthService', () => {
  let service: AuthService;
  let mockRepository: jest.Mocked<AuthRepository>;

  beforeEach(() => {
    mockRepository = {
      findUserByEmail: jest.fn(),
      createUser: jest.fn(),
    };
    service = new AuthService(mockRepository);
  });

  test('should authenticate valid user', async () => {
    mockRepository.findUserByEmail.mockResolvedValue({
      id: '1',
      email: 'test@example.com',
      password: 'hashed',
    });

    const result = await service.authenticate('test@example.com', 'password');
    expect(result).toBeTruthy();
  });
});
```

## 绲愭灉

### 銉°儶銉冦儓

1. **鐞嗚В銇椼倓銇欍仌**
    - 姗熻兘鍗樹綅銇у畬绲?
    - 銉曘偂銈ゃ儷閰嶇疆銇岀洿鎰熺殑
    - 鏂拌闁嬬櫤鑰呫伄瀛︾繏銈炽偣銉堛亴浣庛亜

2. **淇濆畧鎬?*
    - 姗熻兘杩藉姞銇屽鏄?
    - 銉儠銈°偗銈裤儶銉炽偘銇屽眬鎵€鐨?
    - 褰遍熆绡勫洸銇屾槑纰?

3. **銉嗐偣銈裤儞銉儐銈?*
    - 銉儍銈亴瀹规槗
    - 鍗樹綋銉嗐偣銉堛亴鏇搞亶銈勩仚銇?
    - 銉嗐偣銉堛偒銉愩儸銉冦偢銈掔⒑淇濄仐銈勩仚銇?

4. **涓﹀垪闁嬬櫤**
    - 銉偢銉ャ兗銉枔銇鍚堛亴灏戙仾銇?
    - 銉併兗銉犻枊鐧恒亴瀹规槗
    - 璨换绡勫洸銇屾槑纰?

### 銉囥儭銉儍銉?

1. **鍒濇湡绉昏銈炽偣銉?*
    - 鏃㈠瓨銈炽兗銉夈伄澶ц妯°仾绉诲嫊銇屽繀瑕?
    - 涓€鏅傜殑銇笉瀹夊畾鍖栥伄鍙兘鎬?

2. **鍏遍€氭鑳姐伄閲嶈**
    - 鍚勩儮銈搞儱銉笺儷銇т技銇熴偝銉笺儔銇岀櫤鐢熴仚銈嬪彲鑳芥€?
    - 鍏遍€氬寲銇偪銈ゃ儫銉炽偘銇垽鏂亴蹇呰

## 绉昏瑷堢敾

### Phase 1: 婧栧倷
- [ ] 鏂版閫犮伄銉囥偅銉偗銉堛儶浣滄垚
- [ ] 鍏遍€氭鑳斤紙shared锛夈伄鏁村倷
- [ ] 渚濆瓨鎬ф敞鍏ャ伄浠曠祫銇挎绡?

### Phase 2: 娈甸殠鐨勭Щ琛?
- [ ] 鍚勩儮銈搞儱銉笺儷銇爢娆＄Щ琛?

### Phase 3: 銈儶銉笺兂銈儍銉?
- [ ] 鏃ф閫犮伄鍓婇櫎
- [ ] 銉夈偔銉ャ儭銉炽儓鏇存柊
- [ ] 鏈€绲傘儐銈广儓

## 鍙傝€冭硣鏂?

- [Modular Architecture Pattern](https://martinfowler.com/articles/modular-architecture.html)
- [Feature-Sliced Design](https://feature-sliced.design/)
- [Vertical Slice Architecture](https://jimmybogard.com/vertical-slice-architecture/)
