"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
// ตรวจสอบพาธของรูปภาพนี้ว่าถูกต้องหรือไม่
import planning from "/assets/done.png"; 
import Link from "next/link";
// ต้องใช้ useRouter และ useParams
import { useRouter, useParams } from "next/navigation"; 
import { supabase } from "@/lib/supabaseClient";

interface Task {
  id: string; // เปลี่ยนเป็น string เพื่อรองรับ UUID
  title: string;
  detail: string;
  is_completed: boolean;
  image_url: string | null;
}

const BUCKET_NAME = 'task_bk';
const TABLE_NAME = 'task_tb';

export default function EditTaskPage() {
  const router = useRouter();
  const params = useParams();
  
  // ดึง ID จาก Dynamic Route ([id])
  const taskId = Array.isArray(params.id) ? params.id[0] : params.id;
  
  const [taskData, setTaskData] = useState<Task | null>(null);
  const [title, setTitle] = useState("");
  const [detail, setDetail] = useState("");
  const [is_Completed, setIsCompleted] = useState<boolean>(false);
  const [Image_file, setImageFile] = useState<File | null>(null); // ไฟล์รูปใหม่
  const [preview_fie, setPreviewfile] = useState<string>(""); // URL สำหรับแสดงตัวอย่าง
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null); // URL รูปภาพเดิม
  const [isLoading, setIsLoading] = useState(true);

  // 1. ดึงข้อมูล Task เก่ามาแสดงเมื่อหน้าโหลด
  useEffect(() => {
    async function fetchTask() {
      if (!taskId) {
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);

      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select('*')
        .eq('id', taskId)
        .single(); 

      // ******************************************************
      // ส่วนนี้คือส่วนสำคัญที่เคยเกิดปัญหา (RLS)
      // ******************************************************
      if (error || !data) {
        console.error("Fetch Task error:", error || "No data found.");
        alert(`ไม่พบงาน ID: ${taskId} ที่ต้องการแก้ไข หรือเกิดข้อผิดพลาดในการดึงข้อมูล`);
        router.push("/alltask"); 
        return;
      }
      
      // ตั้งค่า State ด้วยข้อมูลเก่าที่ดึงมา
      setTitle(data.title);
      setDetail(data.detail);
      setIsCompleted(data.is_completed);
      setOriginalImageUrl(data.image_url); 
      setPreviewfile(data.image_url || ""); 
      setTaskData(data);
      setIsLoading(false);
    }

    fetchTask();
  }, [taskId, router]); 

  // จัดการกับการเลือกรูปภาพใหม่
  function handleSelectImagePreview(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null;
    setImageFile(file); 
    if (file) {
      setPreviewfile(URL.createObjectURL(file as Blob)); 
    } else {
      setPreviewfile(originalImageUrl || ""); // กลับไปใช้รูปเดิมถ้ายกเลิก
    }
  }

  // 2. ฟังก์ชันแก้ไขและบันทึก (UPDATE)
  async function handleUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!taskId) return; 
    
    alert('กำลังดำเนินการแก้ไขข้อมูล...');

    let image_url: string | null = originalImageUrl;
    
    // ตรรกะการอัปโหลดรูปใหม่และลบรูปเก่า
    if (Image_file) {
      const new_image_file_name = `${Date.now()}-${Image_file.name}`;
      
      const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(new_image_file_name, Image_file);

      if (uploadError) {
        console.error("Upload error:", uploadError);
        alert(`เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ: ${uploadError.message}`);
        return;
      }

      const { data: publicURLData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(new_image_file_name);
      
      image_url = publicURLData.publicUrl;

      // ลบรูปภาพเก่าใน Storage หากมี
      if (originalImageUrl) {
        try {
            const oldFileName = originalImageUrl.split('/').pop();
            if (oldFileName && oldFileName !== 'default-image-name') {
                await supabase.storage.from(BUCKET_NAME).remove([oldFileName]);
            }
        } catch (e) {
             console.warn("Could not delete old image, continuing update.");
        }
      }
    }
    
    // 4. อัปเดตข้อมูล Task ในฐานข้อมูล
    const { error: dbError } = await supabase
      .from(TABLE_NAME)
      .update({
        title: title,
        detail: detail,
        is_completed: is_Completed,
        image_url: image_url, 
      })
      .eq('id', taskId); // ใช้ .eq('id', taskId) เพื่อระบุ Task ที่จะแก้ไข

    if(dbError) {
      console.error("Database UPDATE error:", dbError);
      alert(`เกิดข้อผิดพลาดในการบันทึกข้อมูล: ${dbError.message}`);
    } else {
      alert("แก้ไขงานสำเร็จ!");
      
      router.push("/alltask"); 
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-xl">กำลังโหลดข้อมูล...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-3/4 mx-auto">
      <div className="flex items-center mt-20 flex-col">
        <Image src={planning} alt="Planning Icon" width={150} height={150} />
      </div>
      <div className="mt-10 flex flex-col border border-gray-300 p-5 rounded-xl">
        <h1 className="text-center text-xl font-bold">✏️ แก้ไขงาน (ID: {taskId})</h1>
        <form onSubmit={handleUpdate}> 
          
          <div className="flex flex-col mt5">
            <label className="text-lg font-bold">งานที่ทำ</label>
            <input
              type="text"
              className="border border-gray-300 rounded-lg p-2"
              value={title}
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
            <label className="text-lg font-bold">อัปโหลดรูปภาพ (เลือกรูปใหม่เพื่อเปลี่ยน)</label>
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
              เลือกรูปใหม่
            </label>
            {preview_fie && (
              <div className="mt-3">
                <p className="text-sm text-gray-600 mb-1">รูปภาพปัจจุบัน/รูปภาพใหม่ที่เลือก:</p>
                <Image 
                  key={preview_fie} 
                  src={preview_fie} 
                  alt="preview" 
                  width={100} 
                  height={100} 
                  className="rounded-lg object-cover"
                />
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
            <button type="submit" className="bg-green-500 rounded-lg p-2 text-white font-bold">บันทึกการแก้ไข</button>
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