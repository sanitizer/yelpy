import React from 'react';
import {ScrollView, AppRegistry, Alert, StyleSheet, Text, View, Button} from 'react-native';
import {Table, TableWrapper, Row} from 'react-native-table-component';
import {TextField} from 'react-native-material-textfield';

export default class App extends React.Component {

    constructor(props) {
        super(props);
        this._updateDistance = this._updateDistance.bind(this);
        this._getRestaurantsInAreaResetFromStart = this._getRestaurantsInAreaResetFromStart.bind(this);
        this._getAllRestaurantsInArea = this._getAllRestaurantsInArea.bind(this);
        this.state = {
            dataSource: [],
            tableHead: ["Name", "Address", "Phone", "Price", "Distance (miles)"],
            widthArr: [200, 350, 150, 100, 200],
            distance: "",
            total: 0,
            offset: 0
        }
    }

    _getRestaurantsInAreaResetFromStart () {
            this.setState({
                dataSource: [],
                total: 0,
                offset: 0
            });
            this._getAllRestaurantsInArea();
    }

    _getAllRestaurantsInArea() {
        if (this.state.offset <= this.state.total) {
            this._getRestaurantsInArea(this.state.offset)
                .then(response => response.json())
                .then(responseJson => {
                    let table = this._buildMap(responseJson);
                    this.state.dataSource.push.apply(this.state.dataSource, table);
                    this.state.offset += 50;
                    this.setState({
                        dataSource: this.state.dataSource,
                        total: responseJson.total,
                        offset: this.state.offset
                    });
                })
                .catch(error => console.log("error", error));
        }
    }

    _getRestaurantsInArea (offset) {
        let distance = parseInt(this.state.distance * 1609.34, 10);
        if (distance > max_dist) {
            distance = max_dist;
        }
        return fetch(`https://api.yelp.com/v3/businesses/search?latitude=${lat}&longitude=${long}&radius=${distance}&categories=food, all&limit=50&offset=${offset}`,
            {
                method: 'GET',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${key}`,
                },
            });
    }

    _buildMap(responseJson) {
        let tableData = [];
        console.log("total", responseJson.total);
        let rawData = responseJson.businesses;
        for (let i = 0; i < rawData.length; i++) {
            let distance = (0.000621371 * Number(rawData[i].distance)).toFixed(2);
            let rowData = [rawData[i].name,
                rawData[i].location.display_address.join(", "),
                rawData[i].display_phone,
                rawData[i].price,
                distance];
            tableData.push(rowData);
        }
        console.log("records", tableData.length);
        return tableData;
    }

    _updateDistance(text) {
        if (text && !isNaN(text) && Number(text) >= 0 && Number(text) <= 25) {
            this.setState({distance: Number(text).toString()});
        } else if (text) {
            this.setState({distance: this.state.distance});
        } else {
            this.setState({distance: null});
        }
    }

    render() {
        return (
            <View style={styles.container}>
                <ScrollView style={styles.marginTB}
                            horizontal={true}>
                    <View>
                        <Table borderStyle={{borderColor: '#C1C0B9'}}>
                            <Row data={this.state.tableHead}
                                 widthArr={this.state.widthArr}
                                 style={styles.header}
                                 textStyle={styles.text}/>
                        </Table>
                        <ScrollView style={styles.dataWrapper}>
                            <Table borderStyle={{borderColor: '#C1C0B9'}}>
                                {this.state.dataSource.map((place, index) =>
                                    <Row key={index}
                                         data={place}
                                         widthArr={this.state.widthArr}
                                         style={[styles.row, index % 2 && {backgroundColor: '#F7F6E7'}]}
                                         textStyle={styles.text}/>)}
                            </Table>
                        </ScrollView>
                    </View>
                </ScrollView>
                <View style={styles.marginBottom}>
                    <TextField
                        label="Radius in miles"
                        style={{textAlign: 'center'}}
                        onChangeText={text => this._updateDistance(text)}
                        value={this.state.distance}/>
                    <Button title="Load Data"
                            onPress={this._getRestaurantsInAreaResetFromStart}
                            disabled={!this.state.distance}/>
                    <Button title="Get More"
                            onPress={this._getAllRestaurantsInArea}
                            disabled={!this.state.distance || this.state.offset === 0}/>
                </View>
            </View>
        );
    }
}

const key = '';
const lat = '';
const long = '';
const max_dist = 40000; //this is max (25 miles) the value is in meters

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    marginTop: {
        marginTop: 50
    },
    marginBottom: {
        marginBottom: 50
    },
    marginTB: {
        marginTop: 50,
        marginBottom: 50
    },
    header: {
        height: 50,
        backgroundColor: '#537791'
    },
    text: {
        textAlign: 'center',
        fontWeight: '100'
    },
    dataWrapper: {
        marginTop: -1
    },
    row: {
        height: 40,
        backgroundColor: '#E7E6E1'
    }
});
