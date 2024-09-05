
const express= require('express');
const mongoose =require('mongoose');
const Item = require('./models/Items');

const app= express(); 
const port=3000;

mongoose.connect('mongodb://localhost:27017/ecommerce_db')
    .then(()=>{
        console.log('connected to MongoDB...');
})
    .catch(err =>{
        console.error('Failed to connect to MongoDB', err);
});
//Pares JSON -> dùng Middleware
app.use(express.json());


//1.API liệt kê tất cả các Items

app.get('/items',async(req,res)=>{
    try {
        const items =await Item.find();
        res.json(items);

    } catch (error) {
        res.status(500).json({message: error.message});
        
    }

//2.API:Lấy chi tiết item theo ID:GET
app.get('/items/:id',async(req,res)=>{
    try {
        const item = await Item.findById(req.params.id);
        if(!item) return res.status(404).json({message: 'Item not found'});
        res.json(item);

    } catch (error) {
        res.status(500).json({message: error.message});
        
    }
});

//3.API:cập nhật theo ID:PUT
app.put('/items/:id',async(req,res)=>{
    try {
        const item = await Item.findByIdAndUpdate(req.params.id);
        if(!item) return res.status(404).json({message: 'Item not found'});
        res.json(item);
        
    } catch (error) {
        res.status(500).json({message: error.message});
        
    }
});

//4.API:thêm item mới:POST
app.post('/items',async(req,res)=>{});

//5.API: Xóa item theo ID:DELETE
app.delete('/items/:id',async(req,res)=>{});

});

//Cấu hình server
app.listen(port,() =>{
    console.log('Server is running on http://localhost:27017 ${port}');
});
