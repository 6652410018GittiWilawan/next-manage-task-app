"use client";

import React from "react";
import Image from "next/image";
// ตรวจสอบพาธของรูปภาพนี้ว่าถูกต้องหรือไม่:
import planning from "/assets/done.png"; 
import Link from "next/link";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function Page() {
  // ✅ แก้ไข: setTile เป็น setTitle เพื่อความชัดเจน
  const [title, setTitle] = useState(""); 
  const [detail, setDetail] = useState("");
  const [is_Completed, setIsCompleted] = useState<boolean>(false);
  const [Image_file, setImageFile] = useState<File | null>(null);
  const [preview_fie, setPreviewfile] = useState<string>("");

  function handleSelectImagePreview(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null;
    setImageFile(file);
    if (file) {
      setPreviewfile(URL.createObjectURL(file as Blob));
    } else {
      setPreviewfile("");
    }
  }

  async function handleUploadAndSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); 
    alert('กำลังดำเนินการบันทึกข้อมูล...');

    // 💡 เปลี่ยนค่าเริ่มต้นจาก "" เป็น null เพราะ image_url ใน DB ยอมรับ null
    let image_url: string | null = null; 
    const BUCKET_NAME = 'task_bk'; 
    const TABLE_NAME = 'task_tb'; 

    if (Image_file) {
      const new_image_file_name = `${Date.now()}-${Image_file.name}`;

      // 1. อัปโหลดรูปภาพ
      const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(new_image_file_name, Image_file);

      if (uploadError) {
        console.error("Upload error:", uploadError);
        alert(`เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ: ${uploadError.message}
        กรุณาตรวจสอบ Storage Policy ของ Bucket ${BUCKET_NAME}`);
        return; 
      }

      // 2. ดึง Public URL
      const { data: publicURLData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(new_image_file_name);
      
      image_url = publicURLData.publicUrl;
    }
    
    // 3. บันทึกข้อมูล Task
    const { error: dbError } = await supabase
        .from(TABLE_NAME)
        .insert([
            {
                title: title,
                detail: detail,
                is_completed: is_Completed,
                image_url: image_url, // จะเป็น null หรือ URL
            }
        ]);

    if(dbError) {
        console.error("Database INSERT error:", dbError);
        alert(`เกิดข้อผิดพลาดในการบันทึกข้อมูล: ${dbError.message}
        กรุณาตรวจสอบ RLS Policy ของตาราง ${TABLE_NAME}`);
    } else {
        alert("บันทึกงานใหม่สำเร็จ!");
        
        // 4. Cleanup/Reset State
        setTitle(''); // ✅ ใช้ setTitle
        setDetail('');
        setIsCompleted(false);
        setImageFile(null);
        setPreviewfile(""); 
        
        // ** (Optional) หากต้องการเปลี่ยนหน้าไปที่ /alltask:
        // const router = useRouter(); 
        // router.push('/alltask');
    }
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
              className="border border-gray-300 rounded-lg p-2"
              value={title}
              // ✅ ใช้ setTitle
              onChange={(e) => setTitle(e.target.value)} 
            />
          </div>

          <div className="flex flex-col mt5">
            <label className="text-lg font-bold">รายละเอียด</label>
            <textarea
              className="border border-gray-300 rounded-lg"
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
            ></textarea>
          </div>

          <div className="flex flex-col mt5">
            <label className="text-lg font-bold">อัปโหลดรูปภาพ</label>
            <input
              id="fileInput"
              type="file"
              className="hidden"
              accept="image/*"
              onChange={handleSelectImagePreview}
            />
            <label
              htmlFor="fileInput"
              className="bg-blue-500 rounded-lg p-2 text-white cursor-pointer w-30 text-center"
            >
              เลือกรูป
            </label>
            {preview_fie && (
              <div className="mt-3">
                <Image src={preview_fie} alt="preview" width={100} height={100} />
              </div>
            )}
          </div>

          <div className="flex flex-col mt5">
            <label className="text-lg font-bold">สถานะงาน</label>
            <select
              className="border border-gray-300 rounded-lg p-2"
              value={is_Completed ? '1' : '0'} 
              onChange={(e) => setIsCompleted(e.target.value === '1')} 
            >
              <option value="0">ยังไม่เสร็จสิ้น</option>
              <option value="1">เสร็จสิ้น</option>
            </select>
          </div>

          <div className="flex flex-col mt5">
            <button type="submit" className="bg-green-500 rounded-lg p-2 text-white">บันทึกเพิ่มงาน</button>
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