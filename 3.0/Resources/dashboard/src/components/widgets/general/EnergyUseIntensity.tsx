import React, { FunctionComponent, useEffect, useState } from "react";
import {
  WidgetWrapper,
  TitleBar,
  Select,
  Tooltip
} from "uxp/components";
import './EnergyUseIntensity.scss';
import { IContextProvider } from "@uxp";






interface EnergyUseIntensity {
  uxpContext?: IContextProvider;
  instanceId?: string;
}
interface LocationProps {
  location: Array<any>;
}

interface IntensityRange{
  min ?: string,
  max ?: string
}

const EnergyUseIntensity: FunctionComponent<EnergyUseIntensity> = (props) => {
  let url = window.location.href;
  let { instanceId, uxpContext } = props;
  let [title, setTitle] = React.useState("Energy Use Intensity");
//   let [ActIntensity, setActIntensity] = useState<any>([]);
let [actualIntensity,setActualIntensity] = useState<number|null>(null);
  let [showModal, setShowModal] = useState<any>(false);

  const [OORange,setOORange] = useState<IntensityRange>({min:""});
  const [Goldplusrange,setGoldplusrange] = useState<IntensityRange>({min:"",max:""});
  const [Platinumeerange,setPlatinumeerange] = useState<IntensityRange>({min:"",max:""});
  const [SLEERange,setSLEERange] = useState<IntensityRange>({min:"",max:""});

  const [Locations,setLocations] = useState<[]>([]);
  const [selectedLocation,setselectedLocation] = useState<string>("");
  const [tzoffset,settzoffset] = useState<number>(null);

  useEffect(()=>{
    GetBuildingList();
  },[])
  
  function GetBuildingList(){
    props.uxpContext?.executeAction("SLEnergyDashboard","GetBuildings",{}, { json:true })
    .then(res => {
      let result = JSON.parse(res.data);
        if(result.length > 0){
          setLocations(result);
          setselectedLocation(result[0].Key);
          settzoffset(parseInt(result[0].TimeOffSet));
        }else{
          setLocations([]);
        }
    })
    .catch( e => {
      setLocations(null)
      console.log("except: ", e);
    })
  }

  useEffect(() => {
    ActualIntensity();
    GetTypeWiseIntensityRange();
  }, [selectedLocation]);
  
  function ActualIntensity(){
    props.uxpContext?.executeAction("UMS","GetEnergyIntensity",
    {location:selectedLocation}
    ,{ json: true })
    .then(res => {
        let result = res;
        setActualIntensity(Number(result?.intensity)||null);
    })
    .catch(e => {
        console.log("except: ", e);
    })
  }
  
  const lineWidth=(value:any)=>{
    if(value<=115){
      return (value*1.14);
    }else if (value>115 && value<=140) {
      return ((value-115)*5.2)+130;
    }
    else if (value>140 && value<=155) {
      return ((value-140)*8.67)+260;
    }
    else{
      return 500;
    }
  }
  

  function GetTypeWiseIntensityRange(){
      props.uxpContext?.executeAction("UMS","GetSLEESlabs",
            {
                location:selectedLocation
            }
        ,{ json: true })
        .then(res => {
            let result = res;
            setOORange({min:result.OutOfRange.MinIntensity});
            setGoldplusrange({min:result.GoldPlus.MinIntensity,max:result.GoldPlus.MaxIntensity});
            setPlatinumeerange({min:result.Platinum.MinIntensity,max:result.Platinum.MaxIntensity});
            setSLEERange({max:result.SLEE.MaxIntensity});
        })
        .catch(e => {
            console.log("except: ", e);
        })
  }
console.log('here we go');
  return (
    <WidgetWrapper className="EUICondition">
       {actualIntensity ? (
      <div className="chartContainer">
        <div className="headerPart">
          <div>
            <TitleBar className="energyTitle" title={title}>
              <div className="toolTipDiv">
                <Tooltip
                position="bottom"
                  content={() => (
                    <div>
                      Energy Use Intensity is calculated as:<br/>
                      Building Total Annual Energy Consumption (For last 365 days)/ Total Gross Floor Area<br/>
                    </div>
                  )}
                >
                  <div className="infoIcon"></div>
                </Tooltip>
              </div>
            </TitleBar>
          </div>
          <div className="BuildingDropdown">
            {/* <Select
             options={Locations}
             labelField="LocationID"
             valueField="Key"
             selected={selectedLocation}
             onChange={(newValue, option) => {
               setselectedLocation(newValue);
             }}
            /> */}
          </div>
        </div>
        <div>

          <div className="valueContainer">
            <div className="icon"></div>
            <div className="value">{actualIntensity?.toFixed()||'(Unknown)'}<br></br><span className="unit">{'kwh/m2/year'}</span></div>
            {/* <div className="toolTipDiv">
            <Tooltip
            position="bottom"
              content={() => (
                <div>
                  This value will be caluculated dividing<br/>
                  the annual energy consumption of the<br/>
                  building by gross floor area
                </div>
              )}
            >
              <div className="infoIcon"></div>
            </Tooltip>
          </div> */}
          </div>
        <figure >
  
  <div className="graphic" id="root">

    <div className="row">
      <div className="charts">
        <div className="line" style={{width: lineWidth(actualIntensity)}} 
              onClick={() => {
                setShowModal(true);
              }}>
        </div>
        <span className="block">
           <span className="value"></span>
        </span>
       
        <span className="block">
           <span className="value"></span>
        </span>
        <span className="block">
           <span className="value"></span>
        </span>
        <span className="block">
            <span className="value"></span>
        </span>
       
      </div>
    </div>



  </div>


</figure>
<div className="Container">
  <div className="subContainer"><span className="subHeader">SLE EE(&gt;60%)</span><br></br>
<br></br>
<br></br>
    EUI takes is below <br></br>
    {SLEERange.max} kwh/m2/yr
  </div>
  <div className="platiContainer"><span className="subHeader">Platinum(&gt;55%) </span><br></br>
<br></br>
<br></br>
    EUI takes <br></br>
    {Platinumeerange.min}-{Platinumeerange.max} kwh/m2/yr
  </div>
  <div className="goldContainer"><span className="subHeader">Gold Plus(&gt;50%)</span> <br></br>
<br></br>
<br></br>
    EUI takes <br></br>
    {Goldplusrange.min}-{Goldplusrange.max} kwh/m2/yr
  </div>
  <div className="outContainer"><span className="subHeader">Out of desired<br></br>range</span> 
<br></br>
<br></br>
    EUI takes is above <br></br>
    {OORange.min} kwh/m2/yr
  </div>
  
  
</div>

        </div>
      </div>
    
      ) : (
        <div>No data configured</div>
      )}
  {/* <EUITrend
    show={showModal}
    onClose={() => setShowModal(false)}
    Location={selectedLocation}
    uxpContext={uxpContext}
  /> */}
    </WidgetWrapper>
  );
};

export default EnergyUseIntensity;
