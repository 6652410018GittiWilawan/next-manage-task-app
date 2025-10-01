import Image from "next/image";
import logo from "/assets/done.png"
import Link from "next/link";

export default function HomePage() {
  return (
    <>
      <div className="flex flex-col items-center mt-10 ">
        <Image
          src={logo}
          alt="logo"
          width={150}
          height={150}
        />
        <h1 className="text-2xl font-bold mt-4">
          Manage TaskApp
        </h1>
        <h1 className="text-2xl font-bold mt-4">
          บันทีกงานที่ต้องทำ
        </h1>
        <Link href="/alltask" className="mt-10 bg-blue-500 hover:bg-blue-700 text-white font-bold py-4 px-40 rounded">
          เข้าใช้งาน
        </Link>
      </div>
    </>
  );
}