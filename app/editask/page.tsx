"use client";

import React from "react";
import Image from "next/image";
import planning from "/assets/done.png";
import Link from "next/link";
import { useState} from "react";
import { supabase } from "@/lib/supabaseClient";

export default function Page() {
 const[title,setTile] = useState("");
 const[detail,setDetail] = useState("");
const[is_Completed,setIsCompleted] = useState <boolean>(false);
 const[Image_file,setImageFile] = useState<File|null>(null);
 const[preview_fie,setPreviewfile] = useState<string>("");

 function handleSelectImagePreview(e: React.ChangeEvent<HTMLInputElement>) {
  const file = e.target.files?.[0] || null;

  setImageFile(file);
if(file){
  setPreviewfile(URL.createObjectURL(file as Blob));
}
 }

 async function handleUploadAndSave(e:React.FormEvent<HTMLFormElement>) {
  e.preventDefault
  alert('อัปโหลดรูปภาพและบันทึกข้อมูล')
 }
  return (
     <div className="flex flex-col w-3/4 mx-auto">
      <div className="flex items-center mt-20 flex-col">
        <Image src={planning} alt="" width={150} height={150} />
      </div>
     <div className="mt-10 flex flex-col border border-gray-300 p-5 rounded-xl">
      <h1 className="text-center text-xl font-bold">➕ เพิ่มงานใหม่</h1>
      <form onSubmit={handleUploadAndSave}>
     

      <div className="flex flex-col mt5">
        <label className="text-lg font-bold">งานที่ทำ</label>
        <input
        type="text"
        className="border border-gray-300 rounded-lg p-2"/>
      </div>

      <div className="flex flex-col mt5">
        <label className="text-lg font-bold">รายละเอียด</label>
        <textarea className="border border-gray-300 rounded-lg"></textarea>
      </div>

      <div className="flex flex-col mt5">
       <label className="text-lg font-bold">อัปโหลดรูปภาพ</label>
       <input id="fileInput" type="file"className="hidden" accept="image/*" onChange={handleSelectImagePreview}/>
       <label htmlFor="fileInput" className="bg-blue-500 rounded-lg p-2 text-white cursor-pointer w-30 text-center">
        เลือกรูป
       </label>
       {preview_fie &&(
        <div className="mt-3">
           <Image src={preview_fie} alt="preview" width={100} height={100} />
        </div>
       )}
      </div>
      <div className="flex flex-col mt5">
       <label className="text-lg font-bold">สถานะงาน</label>
       <select className="border border-gray-300 rounded-lg p-2">
        <option value="0">ยังไม่เสร็จสิ้น</option>
        <option value="1">เสร็จสิ้น</option>
       </select>
       </div>
     
      <div className="flex flex-col mt5">
       <button className="bg-green-500 rounded-lg p-2 text-white">บันทึกเพิ่มงาน</button>
      </div>
        </form>
      <div>
        
      <div className="flex justify-center mt-10">
        <Link href="/alltask" className="text-blue-700 font-bold">กลับไปหน้าแสดงงานทั้งหมด</Link>
      </div>
      </div>
     </div>

      </div>
  );
}