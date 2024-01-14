import morgan from 'morgan';
import express from 'express';
import path from 'path';
import fs from 'fs';
import cors from 'cors';



const app = express();


const getSingleResource = (resourceName,req,res)=>{
    const {id}= req.params;
    const resource=readResource(resourceName);
    let resourceIndex;

    for (let i =0 ; i<resource.length ; i++){
        const element=resource [i]
        if(Number(element.id)===Number(id)){
            resourceIndex=i;
            break;
        }
    }
    if (resourceIndex===undefined){
        res.status(404).send(`There is no ${resourceName} resource with id ${id}`)
    }
    return [resource[resourceIndex],resourceIndex];
};

const readResource =(resourceName)=>{
    const data =fs.readFileSync(path.resolve(`./database/${resourceName}.json`));
    const resource=JSON.parse(data);
    return resource;
    
}

const writeResource =(resourceName,resource)=>{
    const data =JSON.stringify(resource);
    fs.writeFileSync(path.resolve(`./database/${resourceName}.json`), data);
    
}

const generateID = (resourceName)=>{
    const resource=readResource(resourceName);
    const ids = resource.map(r=>Number(r.id));
    for(let i=0;i<ids.length;i++){
        if(!ids.includes(Number(i))){
            console.log(i)
            return i;
        }
    }

}
const listenResource = (resourceName, keys)=>{
    if(!fs.existsSync(path.resolve(`./database/${resourceName}.json`))){
        writeResource(resourceName, [])
    };
    //GET request
    app.get(`/${resourceName}`,(req,res)=>{
        res.sendFile(path.resolve(`./database/${resourceName}.json`))
    });
    //POST request
    app.post(`/${resourceName}`,(req,res)=>{
        const newResource=req.body;
        let isResourceValid=true;
        isResourceValid &= Object.keys(newResource).length === keys.length;
        if(isResourceValid){
            keys.forEach((key)=>{
                isResourceValid &= newResource[key] !== undefined;
            })
        }
        if(!isResourceValid){
            res.status(400).send(`${resourceName} must have ${keys} properties` )
            return;
        }
        const resourceList=readResource(resourceName);
        newResource.id=generateID(resourceName);
        resourceList.push(newResource);
        writeResource(resourceName,resourceList);
        res.send(newResource);
    });

    //GET da ID
    app.get(`/${resourceName}/:id`, (req,res)=>{
        const [resource]=getSingleResource(resourceName, req, res);
        res.send(resource)
    });
    //PUT da ID
    app.put(`/${resourceName}/:id` , (req, res)=>{
        const newResource=req.body;
        let isResourceValid=true;
        isResourceValid &= Object.keys(newResource).length === keys.length;
        if(isResourceValid){
            keys.forEach((key)=>{
                isResourceValid &= newResource[key] !== undefined;
            })
        }
        if(!isResourceValid){
            res.status(400).send(`${resourceName} must have ${keys} properties` )
            return;
        }
        const [,indexToUpdate]=getSingleResource(resourceName, req, res);
        const resourceList=readResource(resourceName);
        newResource.id=req.params.id;
        resourceList.push(newResource);
        writeResource(resourceName,resourceList);
        res.send(newResource);
    });
    //PATCH da id
    app.patch(`/${resourceName}/:id`, (req,res)=>{
        const newProperties=req.body;
        const numProperties=Object.keys(newProperties).length;
        if(numProperties > keys.length-1){
            res.status(400).send(`use put method instead of patch`);
            return;
        }
        let isPropertiesValid =true;
        Object.keys(newProperties).forEach((key)=>{
            isPropertiesValid &= MediaKeyStatusMap.includes(key);
        });
        if (!isPropertiesValid){
            res.status(400).send(`${resourceName} must have ${keys} properties` );
        }
        const [,indexToUpdate]=getSingleResource(resourceName, req, res);
        const resourceList = readResource(resourceName);
        resourceList[indexToUpdate]={...resourceList[indexToUpdate]};
        writeResource(resourceName,resourceList);
        res.send(resourceList[indexToUpdate]);
    })
    //DELETE da ID
    app.delete(`/${resourceName}/:id`,(req, res)=>{
        const {id}=req.params;
        const resourceList = readResource(resourceName);
        const [, indexToDelete]=getSingleResource(resourceName, req, res);
        resourceList.splice(indexToDelete,1);
        writeResource(resourceName,resourceList);
        res.send(`/${resourceName} with ID: ${id} was deleted`);
    })
}


app.listen(3000,()=>{
    console.log(`server su porta 3000`)
});

app.use(morgan('dev'));
app.use(cors({
    origin:"*"
}))
app.use(express.json());

listenResource('album',['artist','year','number_of_track']);
