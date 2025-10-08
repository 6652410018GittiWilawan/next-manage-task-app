"use client";

import React from "react";
import Image from "next/image";
import planning from "/assets/done.png";
import Link from "next/link";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

type Task = {
  id: string;
  title: string;
  detail: string;
  is_completed: boolean;
  image_url: string;
  created_at: string;
  // ✅ แก้ไข: ใช้ updated_at ตาม Schema ที่คุณแนะนำ
  updated_at: string; 
};

function AllTaskPage() {
  const [tasks, setTasks] = useState<Task[]>([]);

  // 💡 สร้างฟังก์ชันดึงข้อมูลแยกออกมาเพื่อให้เรียกใช้ซ้ำได้ง่าย
  async function fetchTask() {
    // 🚨 ตรวจสอบ RLS Policy: ต้องมี RLS Policy สำหรับ SELECT ที่อนุญาต
    const { data, error } = await supabase
      .from("task_tb") 
      .select("*")
      // ✅ แก้ไข: ใช้ 'created_at' ให้ตรงกับชื่อคอลัมน์ใน DB
      .order("created_at", { ascending: false });

    if (error) {
      alert("พบปัญหาในการดึงข้อมูล");
      console.log("Fetch Error:", error.message);
      return;
    }
    if (data) {
      setTasks(data as Task[]);
    }
  }

  useEffect(() => {
    fetchTask();
    // dependency array ว่างเปล่าหมายความว่าฟังก์ชันนี้จะทำงานแค่ครั้งเดียวหลัง render ครั้งแรก
  }, []);

  // 1. เพิ่มโค้ดที่แก้ไขในฟังก์ชัน handleDeleteTaskClick
  async function handleDeleteTaskClick(id: string, image_url: string) {
    if (confirm("คุณต้องการลบข้อมูลใช่หรือไม่ ?")) {
      const BUCKET_NAME = 'task_bk';
      const TABLE_NAME = 'task_tb';

      // ลบรูปภาพใน Storage (ถ้ามี image_url)
      // 💡 ตรวจสอบเงื่อนไข image_url ให้ดี: image_url เป็น string
      if (image_url) { 
        const image_name = image_url.split("/").pop() as string;
        
        // 🚨 ตรวจสอบ Storage Policy (RLS) สำหรับ DELETE
        const { error: storageError } = await supabase.storage
          .from(BUCKET_NAME)
          .remove([image_name]);

        if (storageError) {
          console.error("Storage Delete Error:", storageError.message);
          alert(`เกิดข้อผิดพลาดในการลบรูปภาพ: ${storageError.message}`);
          // อนุญาตให้โค้ดดำเนินต่อไปเพื่อลบข้อมูลใน DB แม้ว่ารูปจะลบไม่ได้
        }
      }  

      // ลบข้อมูลใน Database
      // ✅ แก้ไข: ลบ {} ออกจาก .delete()
      // 🚨 ตรวจสอบ RLS Policy สำหรับ DELETE
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .delete() // <--- แก้ไขตรงนี้
        .eq("id", id);

      if (error) {
        alert("พบปัญหาในการลบข้อมูล: " + error.message);
        // ✅ แก้ไข: แก้ไข typo จาก 'massage' เป็น 'message'
        console.error("Database Delete Error:", error.message); 
        return;
      }
      
      // 2. ✅ เพิ่มโค้ด: อัปเดต State เพื่อรีเฟรชรายการงานบนหน้าจอทันที
      setTasks(tasks.filter(task => task.id !== id));
      alert("ลบข้อมูลสำเร็จ!");
    }
  }

  return (
    <div className="flex flex-col w-3/4 mx-auto">
      <div className="flex items-center mt-20 flex-col">
        <Image src={planning} alt="" width={150} height={150} />
        <h1 className="text-2xl font-bold mt-10">Manage Task App</h1>
        <h1 className="text-2xl font-bold">บันทึกงานที่ต้องทำ</h1>
      </div>
      <div className="flex justify-end">
        <Link
          href="/addtask"
          className="mt-10 bg-blue-500 hover:bg-blue-700 text-white font-bold py-4 px-4 w-max rounded"
        >
          เพิ่มงาน
        </Link>
      </div>
      <div>
        {/* 💡 แสดงข้อความโหลด/ไม่มีงาน */}
        {tasks.length === 0 ? (
          <p className="text-center mt-10">...กำลังโหลดงาน หรือยังไม่มีงานที่ต้องทำ</p>
        ) : (
          <table className="min-w-full border boder-black text-sm">
            <thead className="bg-gray-200">
              <tr>
                <th className="border border-black p-2">รูป</th>
                <th className="border border-black p-2">งานที่ต้องทำ</th>
                <th className="border border-black p-2">รายละเอียด</th>
                <th className="border border-black p-2">สถานะ</th>
                <th className="border border-black p-2">วันที่เพิ่ม</th>
                <th className="border border-black p-2">วันที่แก้ไข</th>
                <th className="border border-black p-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr key={task.id}>
                  <td className="border border-black p-2">
                    {task.image_url ? (
                      <Image
                        src={task.image_url}
                        alt="task image"
                        width={150}
                        height={150}
                        unoptimized={true} // เพิ่ม unoptimized เพื่อแก้ปัญหาแสดงรูปภาพจากภายนอก
                      />
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="border border-black p-2">{task.title}</td>
                  <td className="border border-black p-2">{task.detail}</td>
                  <td className="border border-black p-2">
                    {task.is_completed ? (
                      <span className="text-green-500 font-medium">เสร็จสิ้นแล้ว</span>
                    ) : (
                      <span className="text-red-500 font-medium">ยังไม่เสร็จสิ้น</span>
                    )}
                  </td>
                  <td className="border border-black p-2">
                    {new Date(task.created_at).toLocaleString()}
                  </td>
                  <td className="border border-black p-2">
                    {new Date(task.updated_at).toLocaleString()} 
                  </td>
                  <td className="border border-black p-2 text-center">
                    <Link href={`/editask/id${task.id}`} className="text-green-500 hover:text-green-700 mr-2">
                      แก้ไข
                    </Link>
                    <button onClick={() => handleDeleteTaskClick(task.id, task.image_url)}
                      className="text-red-500 hover:text-red-700">
                      ลบ
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <div className="flex justify-center mt-10">
        <Link href="/" className="text-blue-700 font-bold">
          กลับไปหน้าแรก
        </Link>
      </div>
    </div>
  );
}

export default AllTaskPage;