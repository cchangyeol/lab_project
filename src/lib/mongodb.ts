// MongoDB Atlas에 연결하고, 그 연결을 다른 파일에서 재사용할 수 있게 만드는 파일

import { MongoClient } from "mongodb"; // MongoDB에 접속하기 위한 도구 가져옴

const uri = process.env.MONGODB_URI; // .env.local에서 MongoDB URI 가져오기

if (!uri) {
  // 접속 주소가 없으면 바로 에러를 내서 원인 파악함
  throw new Error('.env.local 파일에 MONGODB_URI을 설정해주세요.');
}

let client: MongoClient; // MongoDB 클라이언트 객체를 담을 변수
let clientPromise: Promise<MongoClient>; // 연결이 끝나면 client를 돌려주는 약속

if (process.env.NODE_ENV === 'development') {
  // 개발 모드에서는 파일을 고칠 때 마다 다시 불러와지는데, 그때마다 새로 연결하지 않도록 global에 연결을 저장해서 재사용
  const globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
  };

  if (!globalWithMongo._mongoClientPromise) {
    // 아직 저장된 연결이 없으면 새로 연결하고 global에 저장해둔다
    client = new MongoClient(uri);
    globalWithMongo._mongoClientPromise = client.connect();
  }
  clientPromise = globalWithMongo._mongoClientPromise; // global에 저장된 연결을 재사용
} else {
  // 배포 환경에서는 매번 새로 연결해도 문제 없음
  client = new MongoClient(uri);
  clientPromise = client.connect();
}

export default clientPromise; // 다른 파일에서 이 연결을 가져다 쓸 수 있게 내보냄
